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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class AmapLocationService {
  private static final String AMAP_INPUT_TIPS_URL = "https://restapi.amap.com/v3/assistant/inputtips";
  private static final String AMAP_PLACE_TEXT_URL = "https://restapi.amap.com/v3/place/text";
  private static final String AMAP_GEOCODE_URL = "https://restapi.amap.com/v3/geocode/geo";
  private static final String AMAP_REVERSE_URL = "https://restapi.amap.com/v3/geocode/regeo";

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

  public List<ResolvedLocation> suggest(String keyword, String city) {
    String normalized = keyword == null ? "" : keyword.trim();
    if (normalized.isBlank() || !hasAmapKey()) {
      return List.of();
    }

    try {
      Map<String, ResolvedLocation> suggestions = new LinkedHashMap<>();
      for (ResolvedLocation location : suggestByInputTips(normalized, city)) {
        suggestions.putIfAbsent(suggestionKey(location), location);
      }
      if (suggestions.size() < 10) {
        for (ResolvedLocation location : suggestByPlace(normalized, city)) {
          suggestions.putIfAbsent(suggestionKey(location), location);
          if (suggestions.size() >= 10) {
            break;
          }
        }
      }
      if (suggestions.isEmpty() && city != null && !city.isBlank()) {
        return suggest(normalized, "");
      }
      return suggestions.values().stream().limit(10).toList();
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      return List.of();
    } catch (IOException exception) {
      return List.of();
    }
  }

  public ResolvedLocation reverse(double longitude, double latitude) {
    if (longitude == 0 || latitude == 0) {
      throw new IllegalArgumentException("经纬度无效");
    }
    ensureEnabled();

    try {
      String url =
          AMAP_REVERSE_URL
              + "?key="
              + encode(properties.amap().webServiceKey())
              + "&location="
              + encode(longitude + "," + latitude)
              + "&extensions=all&radius=1000";
      JsonNode regeocode = get(url).path("regeocode");
      if (regeocode.isMissingNode() || regeocode.isNull()) {
        throw new IllegalArgumentException("暂时无法识别当前位置");
      }

      JsonNode component = regeocode.path("addressComponent");
      String city = normalizedAdmin(text(component, "city"));
      if (city.isBlank()) {
        city = normalizedAdmin(text(component, "province"));
      }
      String district = normalizedAdmin(text(component, "district"));
      String name = nearbyName(regeocode);
      String address = text(regeocode, "formatted_address");
      String label = label(city, district, name.isBlank() ? "当前位置" : name);
      return new ResolvedLocation(label, city, district, address, "当前位置", longitude, latitude, "geolocation");
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("高德逆地理编码暂时不可用，请稍后重试", exception);
    } catch (IOException exception) {
      throw new IllegalStateException("高德逆地理编码暂时不可用，请稍后重试", exception);
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

  private List<ResolvedLocation> suggestByInputTips(String keyword, String city)
      throws IOException, InterruptedException {
    String url =
        AMAP_INPUT_TIPS_URL
            + "?key="
            + encode(properties.amap().webServiceKey())
            + "&keywords="
            + encode(keyword)
            + "&datatype=all";
    if (city != null && !city.isBlank()) {
      url += "&city=" + encode(city.trim());
    }

    JsonNode tips = get(url).path("tips");
    if (!tips.isArray()) {
      return List.of();
    }

    List<ResolvedLocation> results = new ArrayList<>();
    for (JsonNode tip : tips) {
      String name = text(tip, "name");
      if (name.isBlank()) {
        continue;
      }
      String location = text(tip, "location");
      Coordinate coordinate = coordinateFrom(location);
      String districtText = normalizedAdmin(text(tip, "district"));
      String cityName = normalizedAdmin(text(tip, "city"));
      if (cityName.isBlank()) {
        cityName = cityFromDistrict(districtText);
      }
      String district = districtFromText(cityName, districtText);
      String address = text(tip, "address");
      results.add(
          new ResolvedLocation(
              label(cityName, district, name),
              cityName,
              district,
              address,
              keyword,
              coordinate.longitude(),
              coordinate.latitude(),
              "manual"));
      if (results.size() >= 10) {
        break;
      }
    }
    return results;
  }

  private List<ResolvedLocation> suggestByPlace(String keyword, String city)
      throws IOException, InterruptedException {
    String url =
        AMAP_PLACE_TEXT_URL
            + "?key="
            + encode(properties.amap().webServiceKey())
            + "&keywords="
            + encode(keyword)
            + "&offset=10&page=1&extensions=all";
    if (city != null && !city.isBlank()) {
      url += "&city=" + encode(city.trim());
    }
    JsonNode pois = get(url).path("pois");
    if (!pois.isArray()) {
      return List.of();
    }
    List<ResolvedLocation> results = new ArrayList<>();
    for (JsonNode poi : pois) {
      Optional<ResolvedLocation> location = locationFromPoi(poi, keyword);
      location.ifPresent(results::add);
      if (results.size() >= 10) {
        break;
      }
    }
    return results;
  }

  private Optional<ResolvedLocation> locationFromPoi(JsonNode poi, String keyword) {
    String name = text(poi, "name");
    String location = text(poi, "location");
    Coordinate coordinate = coordinateFrom(location);
    if (name.isBlank() || coordinate.longitude() == null || coordinate.latitude() == null) {
      return Optional.empty();
    }
    String city = normalizedAdmin(text(poi, "cityname"));
    String district = normalizedAdmin(text(poi, "adname"));
    String address = text(poi, "address");
    return Optional.of(
        new ResolvedLocation(
            label(city, district, name), city, district, address, keyword, coordinate.longitude(), coordinate.latitude(), "manual"));
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
    if (!hasAmapKey()) {
      throw new IllegalStateException("未配置高德 Web 服务 Key，无法解析位置");
    }
  }

  private boolean hasAmapKey() {
    return properties.amap() != null
        && properties.amap().webServiceKey() != null
        && !properties.amap().webServiceKey().isBlank();
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

  private Coordinate coordinateFrom(String location) {
    if (location == null || location.isBlank() || "[]".equals(location) || !location.contains(",")) {
      return new Coordinate(null, null);
    }
    String[] parts = location.split(",");
    Double longitude = parseNullableDouble(parts[0]);
    Double latitude = parts.length > 1 ? parseNullableDouble(parts[1]) : null;
    return new Coordinate(longitude, latitude);
  }

  private Double parseNullableDouble(String value) {
    try {
      if (value == null || value.isBlank() || "[]".equals(value)) {
        return null;
      }
      return Double.parseDouble(value);
    } catch (NumberFormatException ignored) {
      return null;
    }
  }

  private String suggestionKey(ResolvedLocation location) {
    return String.join(
        "|",
        location.city() == null ? "" : location.city(),
        location.district() == null ? "" : location.district(),
        location.label() == null ? "" : location.label());
  }

  private String nearbyName(JsonNode regeocode) {
    JsonNode pois = regeocode.path("pois");
    if (pois.isArray() && pois.size() > 0) {
      String name = text(pois.get(0), "name");
      if (!name.isBlank()) {
        return name;
      }
    }
    JsonNode aois = regeocode.path("aois");
    if (aois.isArray() && aois.size() > 0) {
      String name = text(aois.get(0), "name");
      if (!name.isBlank()) {
        return name;
      }
    }
    JsonNode roads = regeocode.path("roads");
    if (roads.isArray() && roads.size() > 0) {
      return text(roads.get(0), "name");
    }
    return "";
  }

  private String cityFromDistrict(String districtText) {
    if (districtText == null || districtText.isBlank()) {
      return "";
    }
    String[] directCities = {"北京市", "上海市", "天津市", "重庆市"};
    for (String city : directCities) {
      if (districtText.startsWith(city)) {
        return city;
      }
    }
    int marker = districtText.indexOf("市");
    if (marker > 0) {
      return districtText.substring(0, marker + 1);
    }
    return "";
  }

  private String districtFromText(String city, String districtText) {
    if (districtText == null || districtText.isBlank()) {
      return "";
    }
    if (city != null && !city.isBlank() && districtText.startsWith(city)) {
      return districtText.substring(city.length());
    }
    return districtText;
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private record Coordinate(Double longitude, Double latitude) {}
}
