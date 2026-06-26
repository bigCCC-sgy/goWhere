package com.gowhere.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gowhere.config.GoWhereProperties;
import com.gowhere.model.AreaConfig;
import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import com.gowhere.service.ConfigService;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class AmapPoiProvider {
  private static final String AMAP_PLACE_AROUND_URL = "https://restapi.amap.com/v3/place/around";

  private final GoWhereProperties properties;
  private final MockPoiProvider fallback;
  private final ConfigService configService;
  private final AmapLocationService locationService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public AmapPoiProvider(
      GoWhereProperties properties,
      MockPoiProvider fallback,
      ConfigService configService,
      AmapLocationService locationService,
      ObjectMapper objectMapper) {
    this.properties = properties;
    this.fallback = fallback;
    this.configService = configService;
    this.locationService = locationService;
    this.objectMapper = objectMapper;
    this.httpClient =
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
  }

  public List<Poi> search(GenerateRecommendationRequest request) {
    if (properties.amap() == null
        || properties.amap().webServiceKey() == null
        || properties.amap().webServiceKey().isBlank()) {
      if (mockEnabled()) {
        return fallback.search(request);
      }
      throw new IllegalStateException("未配置高德 Web 服务 Key，无法使用真实 POI 服务。");
    }

    try {
      List<Poi> amapPois = searchAmap(request);
      if (amapPois.size() >= 4) {
        return amapPois;
      }
      if (mockEnabled()) {
        return mergeWithFallback(amapPois, request);
      }
      return amapPois;
    } catch (Exception exception) {
      if (mockEnabled()) {
        return fallback.search(request);
      }
      throw new IllegalStateException("高德 POI 服务调用失败：" + exception.getMessage(), exception);
    }
  }

  private boolean mockEnabled() {
    return properties.recommendation() != null && properties.recommendation().mockEnabled();
  }

  private List<Poi> searchAmap(GenerateRecommendationRequest request) throws IOException, InterruptedException {
    Coordinate center = centerOf(request);
    Map<String, Poi> pois = new LinkedHashMap<>();
    List<Poi> overflow = new ArrayList<>();
    List<String> keywords = keywordsFor(request);
    for (int index = 0; index < keywords.size(); index++) {
      String keyword = keywords.get(index);
      int addedForKeyword = 0;
      List<Poi> keywordPois;
      try {
        keywordPois =
            searchAmapByKeyword(request, center, keyword).stream()
                .sorted(Comparator.comparingInt(poi -> score(request, poi)))
                .toList();
      } catch (IOException exception) {
        if (!pois.isEmpty()) {
          break;
        }
        throw exception;
      }
      for (Poi poi : keywordPois) {
        if (pois.containsKey(poi.id())) {
          continue;
        }
        if (addedForKeyword < perKeywordLimit(request, keyword)) {
          pois.put(poi.id(), poi);
          addedForKeyword++;
        } else {
          overflow.add(poi);
        }
      }
      if (index < keywords.size() - 1) {
        Thread.sleep(420);
      }
    }

    if (pois.size() < 10) {
      for (Poi poi : overflow) {
        pois.putIfAbsent(poi.id(), poi);
        if (pois.size() >= 14) {
          break;
        }
      }
    }

    List<Poi> ranked = pois.values().stream()
        .sorted(Comparator.comparingInt(poi -> score(request, poi)))
        .limit(10)
        .toList();

    if (wantsLodging(request) && ranked.stream().noneMatch(this::isLodging)) {
      Optional<Poi> lodgingPoi = pois.values().stream().filter(this::isLodging).findFirst();
      if (lodgingPoi.isPresent() && !ranked.isEmpty()) {
        List<Poi> adjusted = new ArrayList<>(ranked);
        adjusted.removeIf(poi -> poi.id().equals(lodgingPoi.get().id()));
        adjusted.add(0, lodgingPoi.get());
        return adjusted.stream().limit(10).toList();
      }
    }

    if (!wantsLodging(request) && wantsDining(request) && ranked.stream().noneMatch(this::isDining)) {
      Optional<Poi> diningPoi = pois.values().stream().filter(this::isDining).findFirst();
      if (diningPoi.isPresent() && !ranked.isEmpty()) {
        List<Poi> adjusted = new ArrayList<>(ranked);
        adjusted.removeIf(poi -> poi.id().equals(diningPoi.get().id()));
        adjusted.add(0, diningPoi.get());
        return adjusted.stream().limit(10).toList();
      }
    }

    return ranked;
  }

  private int perKeywordLimit(GenerateRecommendationRequest request, String keyword) {
    if (wantsLodging(request) && isLodgingKeyword(keyword)) {
      return 7;
    }
    if (wantsDining(request) && isDiningKeyword(keyword)) {
      return 5;
    }
    if ("date".equals(request.scene())) {
      return 3;
    }
    return 4;
  }

  private boolean isLodgingKeyword(String keyword) {
    return keyword != null
        && (keyword.contains("酒店")
            || keyword.contains("住宿")
            || keyword.contains("宾馆")
            || keyword.contains("民宿")
            || keyword.contains("快捷酒店")
            || keyword.contains("星级酒店"));
  }

  private boolean isDiningKeyword(String keyword) {
    return keyword != null
        && (keyword.contains("餐")
            || keyword.contains("饭")
            || keyword.contains("菜")
            || keyword.contains("日料")
            || keyword.contains("西餐")
            || keyword.contains("火锅")
            || keyword.contains("烧烤")
            || keyword.contains("小吃")
            || keyword.contains("轻食")
            || keyword.contains("简餐")
            || keyword.contains("海鲜")
            || keyword.contains("粉面")
            || keyword.contains("麻辣烫"));
  }

  private List<Poi> searchAmapByKeyword(
      GenerateRecommendationRequest request, Coordinate center, String keyword)
      throws IOException, InterruptedException {
    String url =
        AMAP_PLACE_AROUND_URL
            + "?key="
            + encode(properties.amap().webServiceKey())
            + "&location="
            + center.longitude()
            + ","
            + center.latitude()
            + "&keywords="
            + encode(keyword)
            + cityQuery(request)
            + "&radius="
            + Math.max(500, properties.amap().radiusMeters())
            + "&offset=12&page=1&extensions=all";

    HttpRequest httpRequest =
        HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(
                Duration.ofMillis(Math.max(3000, properties.ai() == null ? 8000 : properties.ai().timeoutMs())))
            .GET()
            .build();
    HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IOException("AMap returned HTTP " + response.statusCode());
    }

    JsonNode root = objectMapper.readTree(response.body());
    if (!"1".equals(root.path("status").asText())) {
      throw new IOException("AMap status failed: " + root.path("info").asText());
    }

    List<Poi> pois = new ArrayList<>();
    for (JsonNode node : root.path("pois")) {
      parsePoi(node, request, center).ifPresent(pois::add);
    }
    return pois;
  }

  private Optional<Poi> parsePoi(JsonNode node, GenerateRecommendationRequest request, Coordinate center) {
    String sourcePoiId = text(node, "id");
    String name = text(node, "name");
    String location = text(node, "location");
    if (sourcePoiId.isBlank() || name.isBlank() || !location.contains(",")) {
      return Optional.empty();
    }

    String[] parts = location.split(",");
    double longitude = parseDouble(parts[0], center.longitude());
    double latitude = parseDouble(parts[1], center.latitude());
    String fullType = text(node, "type");
    String category = displayCategory(fullType);
    JsonNode bizExt = node.path("biz_ext");
    int avgPrice = (int) Math.round(parseDouble(bizExt.path("cost").asText("0"), 0));
    double rating = parseDouble(bizExt.path("rating").asText("0"), 0);
    int distance = node.path("distance").asInt((int) Math.round(distanceMeters(center, longitude, latitude)));
    String phone = nonBlank(text(node, "tel"), text(node, "phone"));
    String businessArea = text(node, "business_area");
    String detailUrl = text(node, "website");
    String amapUri = "https://uri.amap.com/search?keyword=" + encode(name);

    List<String> tags = tagsFor(request, category, fullType, avgPrice);
    return Optional.of(
        new Poi(
            "amap-" + sourcePoiId,
            "amap",
            sourcePoiId,
            name,
            text(node, "address"),
            nonBlank(text(node, "cityname"), cityForSearch(request)),
            text(node, "adname"),
            longitude,
            latitude,
            category.isBlank() ? "城市地点" : category,
            Math.max(0, distance),
            Math.max(0, avgPrice),
            rating <= 0 ? null : rating,
            nonBlank(businessArea, "以地图与商家信息为准"),
            tags,
            photoUrls(node),
            phone,
            businessArea,
            detailUrl,
            amapUri));
  }

  private Coordinate centerOf(GenerateRecommendationRequest request) {
    Optional<Coordinate> userLocationCoordinate = coordinateOf(request.userLocation());
    if (userLocationCoordinate.isPresent()) {
      return userLocationCoordinate.get();
    }
    if (request.location() != null
        && request.location().longitude() != null
        && request.location().latitude() != null
        && request.location().longitude() != 0
        && request.location().latitude() != 0) {
      return new Coordinate(request.location().longitude(), request.location().latitude());
    }
    String manualKeyword = manualLocationKeyword(request);
    if (!manualKeyword.isBlank()) {
      var resolved = locationService.resolve(manualKeyword);
      return new Coordinate(resolved.longitude(), resolved.latitude());
    }
    return configService.areas().stream()
        .filter(area -> area.code().equals(request.areaCode()))
        .findFirst()
        .map(area -> new Coordinate(area.longitude(), area.latitude()))
        .orElseGet(
            () ->
                configService.areas().stream()
                    .filter(area -> area.city().equals(request.city()))
                    .findFirst()
                    .map(area -> new Coordinate(area.longitude(), area.latitude()))
                    .orElse(new Coordinate(118.784, 32.041)));
  }

  private Optional<Coordinate> coordinateOf(GenerateRecommendationRequest.UserLocation location) {
    if (location == null
        || location.longitude() == null
        || location.latitude() == null
        || location.longitude() == 0
        || location.latitude() == 0) {
      return Optional.empty();
    }
    return Optional.of(new Coordinate(location.longitude(), location.latitude()));
  }

  private String manualLocationKeyword(GenerateRecommendationRequest request) {
    if (request.userLocation() == null) {
      return "";
    }
    GenerateRecommendationRequest.UserLocation location = request.userLocation();
    if (location.keyword() != null && !location.keyword().isBlank()) {
      return location.keyword().trim();
    }
    if (location.label() != null && !location.label().isBlank()) {
      return location.label().trim();
    }
    if (location.address() != null && !location.address().isBlank()) {
      return location.address().trim();
    }
    return "";
  }

  private List<Poi> mergeWithFallback(List<Poi> amapPois, GenerateRecommendationRequest request) {
    Map<String, Poi> merged = new LinkedHashMap<>();
    amapPois.forEach(poi -> merged.put(poi.id(), poi));
    fallback.search(request).forEach(poi -> merged.putIfAbsent(poi.id(), poi));
    return merged.values().stream().limit(10).toList();
  }

  private List<String> keywordsFor(GenerateRecommendationRequest request) {
    String query = request.query() == null ? "" : request.query().trim();
    boolean lodging = wantsLodging(request);
    List<String> keywords = new ArrayList<>();
    keywords.addAll(intentKeywords(request));
    if (!query.isBlank() && query.length() >= 2 && query.length() <= 30 && !wantsDining(request)) {
      keywords.add(query);
    }
    if (lodging) {
      return keywords.stream().distinct().limit(6).toList();
    }
    keywords.addAll(sceneKeywords(request.scene()));
    int limit = wantsDining(request) ? 5 : 6;
    return keywords.stream().distinct().limit(limit).toList();
  }

  private List<String> intentKeywords(GenerateRecommendationRequest request) {
    if (wantsLodging(request)) {
      return List.of("酒店", "住宿", "宾馆", "民宿", "快捷酒店", "星级酒店");
    }
    if (wantsDining(request)) {
      return diningIntentKeywords(request.scene());
    }
    String query = normalizedQuery(request);
    if (query.contains("咖啡")) {
      return List.of("咖啡", "甜品");
    }
    if (query.contains("散步") || query.contains("公园")) {
      return List.of("公园", "街区");
    }
    return List.of();
  }

  private List<String> diningIntentKeywords(String scene) {
    return switch (scene) {
      case "hotpot_bbq" -> List.of("火锅", "烧烤", "串串", "餐厅");
      case "local_snack" -> List.of("小吃", "地方小吃", "夜市", "餐饮");
      case "light_meal" -> List.of("轻食", "简餐", "沙拉", "餐厅");
      case "date_dining" -> List.of("餐厅", "西餐", "日料", "约会餐厅");
      default -> List.of("餐厅", "南京菜", "淮扬菜", "西餐", "日料");
    };
  }

  private List<String> sceneKeywords(String scene) {
    return switch (scene) {
      case "eat" -> List.of("餐厅", "南京菜", "淮扬菜", "江浙菜", "小吃");
      case "hotpot_bbq" -> List.of("火锅", "烧烤", "串串", "烤肉");
      case "afternoon_tea" -> List.of("下午茶", "茶饮", "甜品", "咖啡");
      case "local_snack" -> List.of("地方小吃", "小吃", "夜市", "面馆");
      case "light_meal" -> List.of("轻食", "简餐", "沙拉", "餐厅");
      case "date_dining" -> List.of("餐厅", "西餐", "日料", "咖啡");
      case "date" -> List.of("餐厅", "咖啡", "甜品", "公园");
      case "weekend" -> List.of("展览", "书店", "街区", "公园", "商场");
      case "alone" -> List.of("书店", "咖啡", "图书馆", "公园");
      case "rain" -> List.of("商场", "书店", "展览", "咖啡");
      case "friends" -> List.of("餐厅", "KTV", "台球", "棋牌室", "商场");
      case "coffee" -> List.of("咖啡", "甜品", "茶饮", "面包店");
      case "culture" -> List.of("展览", "美术馆", "博物馆", "剧院", "演出");
      case "movie" -> List.of("电影院", "影院", "影城");
      case "show" -> List.of("电影院", "剧院", "演出", "livehouse");
      case "walk" -> List.of("公园", "街区", "景点", "步行街");
      case "nightlife" -> List.of("酒吧", "小酒馆", "夜市", "livehouse");
      case "ktv" -> List.of("KTV", "量贩式KTV", "音乐娱乐");
      case "internet_cafe" -> List.of("网吧", "电竞馆", "电竞酒店", "网咖");
      case "billiards_boardgames" -> List.of("台球", "棋牌室", "桌游");
      case "arcade" -> List.of("游乐场", "电玩城", "亲子乐园");
      case "family" -> List.of("亲子", "公园", "商场", "儿童乐园");
      case "pet" -> List.of("宠物友好", "公园", "宠物店", "咖啡");
      case "work" -> List.of("图书馆", "咖啡", "自习室", "书店");
      case "sport" -> List.of("健身", "运动", "公园", "瑜伽");
      case "shopping" -> List.of("商场", "购物中心", "步行街");
      case "photo" -> List.of("景点", "街区", "展览", "公园");
      case "halfday" -> List.of("景点", "街区", "咖啡", "展览");
      case "massage" -> List.of("按摩", "足疗", "养生");
      case "bath_spa" -> List.of("洗浴", "汗蒸", "温泉");
      case "quiet_sit" -> List.of("咖啡", "书店", "茶馆", "图书馆");
      case "park_walk" -> List.of("公园", "绿地", "景区", "步道");
      case "bookstore_coffee" -> List.of("书店", "咖啡", "图书馆");
      case "tonight" -> List.of("餐厅", "咖啡", "商场", "电影院", "KTV");
      case "after_work" -> List.of("餐厅", "按摩", "足疗", "咖啡", "商场");
      case "lodging" -> List.of("酒店", "住宿", "宾馆", "民宿", "快捷酒店", "星级酒店");
      default -> List.of("餐厅", "咖啡", "小吃", "商场");
    };
  }

  private int score(GenerateRecommendationRequest request, Poi poi) {
    int score = poi.distanceMeters();
    if (wantsLodging(request)) {
      if (isLodging(poi)) {
        score -= 2400;
      } else if (isFoodOrNightlife(poi)) {
        score += 3200;
      } else {
        score += 1200;
      }
    } else if (wantsDining(request)) {
      if (isCafe(poi)) {
        score += 2400;
      } else if (isDessert(poi)) {
        score += 1400;
      } else if (isDining(poi)) {
        score -= 1800;
      }
    }
    if (request.budget() > 0 && poi.avgPrice() > request.budget()) {
      score += 900;
    }
    if ("rain".equals(request.scene()) && poi.tags().contains("室内")) {
      score -= 500;
    }
    if ("alone".equals(request.scene()) && poi.tags().contains("安静")) {
      score -= 350;
    }
    if ("date".equals(request.scene()) && poi.tags().contains("适合初见")) {
      score -= 350;
    }
    if ("coffee".equals(request.scene()) && (isCafe(poi) || isDessert(poi))) {
      score -= 450;
    }
    if ("work".equals(request.scene()) && (poi.tags().contains("安静") || poi.category().contains("图书馆"))) {
      score -= 450;
    }
    return score;
  }

  private boolean wantsDining(GenerateRecommendationRequest request) {
    String query = normalizedQuery(request);
    return isDiningScene(request.scene())
        || query.contains("晚餐")
        || query.contains("氛围晚餐")
        || query.contains("吃饭")
        || query.contains("餐厅")
        || query.contains("正餐")
        || query.contains("约饭")
        || query.contains("吃点")
        || query.contains("下班饭")
        || query.contains("先吃")
        || query.contains("南京菜")
        || query.contains("淮扬菜")
        || query.contains("川湘菜")
        || query.contains("江浙菜")
        || query.contains("粤菜")
        || query.contains("日料")
        || query.contains("韩餐")
        || query.contains("西餐")
        || query.contains("东南亚菜")
        || query.contains("海鲜")
        || query.contains("烤鱼")
        || query.contains("小龙虾")
        || query.contains("串串")
        || query.contains("冒菜")
        || query.contains("麻辣烫")
        || query.contains("粉面")
        || query.contains("素食");
  }

  private boolean isDiningScene(String scene) {
    return "eat".equals(scene)
        || "hotpot_bbq".equals(scene)
        || "local_snack".equals(scene)
        || "light_meal".equals(scene)
        || "date_dining".equals(scene);
  }

  private boolean wantsLodging(GenerateRecommendationRequest request) {
    String query = normalizedQuery(request);
    return "lodging".equals(request.scene())
        || query.contains("酒店")
        || query.contains("住宿")
        || query.contains("宾馆")
        || query.contains("民宿")
        || query.contains("住一晚")
        || query.contains("入住")
        || query.contains("过夜")
        || query.contains("订房")
        || query.contains("附近住")
        || query.contains("找住的")
        || query.contains("住哪里");
  }

  private String normalizedQuery(GenerateRecommendationRequest request) {
    return request.query() == null ? "" : request.query().trim().toLowerCase(Locale.ROOT);
  }

  private String cityQuery(GenerateRecommendationRequest request) {
    String city = cityForSearch(request);
    if (city.isBlank() || "全国".equals(city)) {
      return "";
    }
    return "&city=" + encode(city);
  }

  private String cityForSearch(GenerateRecommendationRequest request) {
    if (request.userLocation() != null
        && request.userLocation().city() != null
        && !request.userLocation().city().isBlank()) {
      return request.userLocation().city();
    }
    if (request.location() != null
        && request.location().city() != null
        && !request.location().city().isBlank()) {
      return request.location().city();
    }
    return request.city() == null ? "" : request.city();
  }

  private boolean isLodging(Poi poi) {
    String haystack = poiText(poi);
    return haystack.contains("酒店")
        || haystack.contains("住宿")
        || haystack.contains("宾馆")
        || haystack.contains("民宿")
        || haystack.contains("旅馆")
        || haystack.contains("客栈")
        || haystack.contains("公寓酒店")
        || haystack.contains("酒店式公寓")
        || haystack.contains("快捷酒店")
        || haystack.contains("星级酒店")
        || haystack.contains("度假村")
        || haystack.contains("招待所")
        || haystack.contains("lodging")
        || haystack.contains("hotel")
        || haystack.contains("inn");
  }

  private boolean isFoodOrNightlife(Poi poi) {
    String haystack = poiText(poi);
    return isDining(poi)
        || isCafe(poi)
        || isDessert(poi)
        || haystack.contains("酒吧")
        || haystack.contains("bar")
        || haystack.contains("商场")
        || haystack.contains("购物")
        || haystack.contains("娱乐")
        || haystack.contains("ktv")
        || haystack.contains("小吃");
  }

  private boolean isDining(Poi poi) {
    String haystack = poiText(poi);
    return haystack.contains("餐厅")
        || haystack.contains("餐馆")
        || haystack.contains("食府")
        || haystack.contains("中餐")
        || haystack.contains("西餐")
        || haystack.contains("外国餐厅")
        || haystack.contains("日料")
        || haystack.contains("日本料理")
        || haystack.contains("料理")
        || haystack.contains("火锅")
        || haystack.contains("烧烤")
        || haystack.contains("菜")
        || haystack.contains("饭")
        || haystack.contains("面馆")
        || haystack.contains("小吃");
  }

  private boolean isCafe(Poi poi) {
    String haystack = poiText(poi);
    return haystack.contains("咖啡") || haystack.contains("cafe") || haystack.contains("coffee");
  }

  private boolean isDessert(Poi poi) {
    String haystack = poiText(poi);
    return haystack.contains("甜品")
        || haystack.contains("甜点")
        || haystack.contains("饮品")
        || haystack.contains("茶饮")
        || haystack.contains("冰淇淋")
        || haystack.contains("奶茶");
  }

  private String poiText(Poi poi) {
    return (poi.name()
            + " "
            + poi.category()
            + " "
            + poi.address()
            + " "
            + String.join(" ", poi.tags()))
        .toLowerCase(Locale.ROOT);
  }

  private List<String> tagsFor(
      GenerateRecommendationRequest request, String category, String fullType, int avgPrice) {
    List<String> tags = new ArrayList<>();
    String haystack = (category + " " + fullType).toLowerCase(Locale.ROOT);
    if (haystack.contains("酒店")
        || haystack.contains("住宿")
        || haystack.contains("宾馆")
        || haystack.contains("民宿")
        || haystack.contains("旅馆")
        || haystack.contains("客栈")
        || haystack.contains("公寓酒店")
        || haystack.contains("酒店式公寓")) {
      tags.add("住宿");
      tags.add("过夜");
      tags.add("演出后休息");
    }
    tags.add("真实POI");
    if (haystack.contains("商场")
        || haystack.contains("咖啡")
        || haystack.contains("书店")
        || haystack.contains("餐饮")
        || haystack.contains("购物")) {
      tags.add("室内");
    }
    if (haystack.contains("书店") || haystack.contains("图书馆") || "alone".equals(request.scene())) {
      tags.add("安静");
    }
    if (haystack.contains("咖啡") || haystack.contains("甜品") || haystack.contains("公园")) {
      tags.add("适合初见");
    }
    if (avgPrice > 0 && request.budget() > 0 && avgPrice <= request.budget()) {
      tags.add("预算友好");
    }
    if ("friends".equals(request.scene())) {
      tags.add("适合聊天");
    }
    return tags.stream().distinct().toList();
  }

  private String text(JsonNode node, String field) {
    JsonNode value = node.path(field);
    return value.isMissingNode() || value.isNull() ? "" : value.asText("");
  }

  private List<String> photoUrls(JsonNode node) {
    List<String> urls = new ArrayList<>();
    JsonNode photos = node.path("photos");
    if (photos.isArray()) {
      for (JsonNode photo : photos) {
        String url = text(photo, "url");
        if (!url.isBlank()
            && (url.startsWith("http://") || url.startsWith("https://"))
            && !urls.contains(url)) {
          urls.add(url);
        }
        if (urls.size() >= 5) {
          break;
        }
      }
    }
    return urls;
  }

  private String nonBlank(String value, String fallbackValue) {
    return value == null || value.isBlank() ? fallbackValue : value;
  }

  private String displayCategory(String fullType) {
    if (fullType == null || fullType.isBlank()) {
      return "城市地点";
    }
    String[] parts = fullType.split(";");
    if (parts.length >= 2 && !parts[1].isBlank()) {
      return parts[1];
    }
    return parts[0].isBlank() ? "城市地点" : parts[0];
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

  private double distanceMeters(Coordinate center, double longitude, double latitude) {
    double earthRadius = 6371000;
    double dLat = Math.toRadians(latitude - center.latitude());
    double dLng = Math.toRadians(longitude - center.longitude());
    double a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(center.latitude()))
                * Math.cos(Math.toRadians(latitude))
                * Math.sin(dLng / 2)
                * Math.sin(dLng / 2);
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private record Coordinate(double longitude, double latitude) {}
}
