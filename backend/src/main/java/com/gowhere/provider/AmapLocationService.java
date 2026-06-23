package com.gowhere.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gowhere.config.GoWhereProperties;
import com.gowhere.model.ResolvedLocation;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class AmapLocationService {
  private static final String AMAP_PLACE_TEXT_URL = "https://restapi.amap.com/v3/place/text";
  private static final String AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";

  private final GoWhereProperties properties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public AmapLocationService(GoWhereProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
    this.httpClient =
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
  }

  public ResolvedLocation resolve(String keyword) {
    String normalized = keyword == null ? "" : keyword.trim();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("请输入城市、商圈、地址或地标");
    }
    ensureEnabled();

    try {
      Optional<ResolvedLocation> place = resolveByPlace(normalized);
      if (place.isPresent()) {
        return place.get();
      }
      return resolveByGeocode(normalized)
          .orElseThrow(() -> new IllegalArgumentException("没有找到这个位置，请换一个更具体的城市或地标"));
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("高德位置解析暂时不可用，请稍后重试", exception);
    } catch (IOException exception) {
      throw new IllegalStateException("高德位置解析暂时不可用，请稍后重试", exception);
    }
  }

  private Optional<ResolvedLocation> resolveByPlace(String keyword)
      throws IOException, InterruptedException {
    String url =
        AMAP_PLACE_TEXT_URL
            + "?key="
            + encode(properties.amap().webServiceKey())
            + "&keywords="
            + encode(keyword)
            + "&offset=1&page=1&extensions=all";
    JsonNode root = get(url);
    JsonNode first = root.path("pois").isArray() && root.path("pois").size() > 0
        ? root.path("pois").get(0)
        : null;
    if (first == null) {
      return Optional.empty();
    }
    String location = text(first, "location");
    if (!location.contains(",")) {
      return Optional.empty();
    }
    String[] parts = location.split(",");
    double longitude = parseDouble(parts[0], 0);
    double latitude = parseDouble(parts[1], 0);
    if (longitude == 0 || latitude == 0) {
      return Optional.empty();
    }

    String name = text(first, "name");
    String city = normalizedAdmin(text(first, "cityname"));
    String district = normalizedAdmin(text(first, "adname"));
    String address = text(first, "address");
    String label = label(city, district, name.isBlank() ? keyword : name);
    return Optional.of(
        new ResolvedLocation(
            label,
            city,
            district,
            address,
            keyword,
            longitude,
            latitude,
            "manual"));
  }

  private Optional<ResolvedLocation> resolveByGeocode(String keyword)
      throws IOException, InterruptedException {
    String url =
        AMAP_GEOCODE_URL
            + "?key="
            + encode(properties.amap().webServiceKey())
            + "&address="
            + encode(keyword);
    JsonNode root = get(url);
    JsonNode first = root.path("geocodes").isArray() && root.path("geocodes").size() > 0
        ? root.path("geocodes").get(0)
        : null;
    if (first == null) {
      return Optional.empty();
    }
    String location = text(first, "location");
    if (!location.contains(",")) {
      return Optional.empty();
    }
    String[] parts = location.split(",");
    double longitude = parseDouble(parts[0], 0);
    double latitude = parseDouble(parts[1], 0);
    if (longitude == 0 || latitude == 0) {
      return Optional.empty();
    }
    String city = normalizedAdmin(text(first, "city"));
    String district = normalizedAdmin(text(first, "district"));
    String address = text(first, "formatted_address");
    return Optional.of(
        new ResolvedLocation(
            label(city, district, keyword),
            city,
            district,
            address,
            keyword,
            longitude,
            latitude,
            "manual"));
  }

  private JsonNode get(String url) throws IOException, InterruptedException {
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofMillis(Math.max(3000, properties.ai() == null ? 8000 : properties.ai().timeoutMs())))
            .GET()
            .build();
    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IOException("AMap returned HTTP " + response.statusCode());
    }

    JsonNode root = objectMapper.readTree(response.body());
    if (!"1".equals(root.path("status").asText())) {
      throw new IOException("AMap status failed: " + root.path("info").asText());
    }
    return root;
  }

  private void ensureEnabled() {
    if (properties.amap() == null
        || properties.amap().webServiceKey() == null
        || properties.amap().webServiceKey().isBlank()) {
      throw new IllegalStateException("未配置高德 Web 服务 Key，无法解析位置");
    }
  }

  private String label(String city, String district, String name) {
    String area = city == null || city.isBlank() ? district : city;
    if (district != null && !district.isBlank() && !district.equals(city)) {
      area = area == null || area.isBlank() ? district : area + " · " + district;
    }
    return area == null || area.isBlank() ? name : area + " · " + name;
  }

  private String normalizedAdmin(String value) {
    if (value == null || value.isBlank() || "[]".equals(value)) {
      return "";
    }
    return value;
  }

  private String text(JsonNode node, String field) {
    JsonNode value = node.path(field);
    return value.isMissingNode() || value.isNull() ? "" : value.asText("");
  }

  private double parseDouble(String value, double fallbackValue) {
    try {
      if (value == null || value.isBlank() || "[]".equals(value)) {
        return fallbackValue;
      }
      return Double.parseDouble(value);
    } catch (NumberFormatException ignored) {
      return fallbackValue;
    }
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
