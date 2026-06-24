package com.gowhere.service;

import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import com.gowhere.model.RecommendationResponse;
import com.gowhere.model.RecommendationResponse.RecommendationPlan;
import com.gowhere.provider.AmapPoiProvider;
import com.gowhere.provider.HttpAiProvider;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {
  private static final String AI_NOTICE =
      "本方案由 AI 基于真实地点数据生成，仅供出行参考。营业时间、价格、人流和排队情况可能变化，请以地图、商家或现场信息为准。";
  private static final List<String> BLOCKED_TERMS = List.of("违法", "毒品", "打架", "色情", "危险");

  private final AmapPoiProvider poiProvider;
  private final HttpAiProvider aiProvider;
  private final StorageService storageService;
  private final Map<String, RecommendationResponse> records = new ConcurrentHashMap<>();

  public RecommendationService(
      AmapPoiProvider poiProvider, HttpAiProvider aiProvider, StorageService storageService) {
    this.poiProvider = poiProvider;
    this.aiProvider = aiProvider;
    this.storageService = storageService;
  }

  public RecommendationResponse generate(GenerateRecommendationRequest request) {
    if (BLOCKED_TERMS.stream().anyMatch(term -> request.query().contains(term))) {
      throw new IllegalArgumentException("需求包含不适合生成的内容");
    }

    List<Poi> candidates = rankCandidates(request, poiProvider.search(request)).stream().limit(10).toList();
    List<RecommendationPlan> plans = validatePlans(aiProvider.generatePlans(request, candidates), candidates);
    if (plans.isEmpty()) {
      throw new IllegalStateException("暂时没有足够的真实地点生成路线，请换一个商圈或场景再试。");
    }

    String recordId = "rec_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    RecommendationResponse response =
        new RecommendationResponse(
            recordId,
            locationLabel(request) + " · " + request.query(),
            AI_NOTICE,
            plans);
    records.put(recordId, response);
    storageService.saveRecommendation(request, response, candidates, providerName(candidates));
    return response;
  }

  public RecommendationResponse getRecord(String recordId) {
    return records.get(recordId);
  }

  private List<Poi> rankCandidates(GenerateRecommendationRequest request, List<Poi> candidates) {
    return candidates.stream().sorted(Comparator.comparingInt(poi -> score(request, poi))).toList();
  }

  private int score(GenerateRecommendationRequest request, Poi poi) {
    int score = Math.max(0, poi.distanceMeters());
    if (wantsLodging(request)) {
      if (isLodging(poi)) {
        score -= 2600;
      } else if (isFoodOrNightlife(poi)) {
        score += 3400;
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
      score += 1200;
    }
    if (request.budget() > 0 && poi.avgPrice() > 0 && poi.avgPrice() <= request.budget()) {
      score -= 250;
    }
    if (poi.rating() != null && poi.rating() >= 4.5) {
      score -= 180;
    }
    if ("rain".equals(request.scene()) && poi.tags().contains("室内")) {
      score -= 650;
    }
    if ("alone".equals(request.scene()) && poi.tags().contains("安静")) {
      score -= 500;
    }
    if ("date".equals(request.scene()) && poi.tags().contains("适合初见")) {
      score -= 500;
    }
    if ("coffee".equals(request.scene()) && (isCafe(poi) || isDessert(poi))) {
      score -= 520;
    }
    if ("nightlife".equals(request.scene()) && poiText(poi).contains("酒")) {
      score -= 420;
    }
    if ("shopping".equals(request.scene()) && (poi.category().contains("商场") || poi.category().contains("购物"))) {
      score -= 420;
    }
    if ("work".equals(request.scene()) && (poi.tags().contains("安静") || poi.category().contains("图书馆") || poi.category().contains("书店"))) {
      score -= 520;
    }
    if ("photo".equals(request.scene()) && (poi.tags().contains("出片") || poi.category().contains("景点") || poi.category().contains("展览"))) {
      score -= 360;
    }
    if (request.avoidTags() != null) {
      for (String avoidTag : request.avoidTags()) {
        if (poi.tags().contains(avoidTag) || poi.category().contains(avoidTag)) {
          score += 900;
        }
      }
    }
    if (request.moodTags() != null) {
      for (String moodTag : request.moodTags()) {
        if (poi.tags().contains(moodTag) || poi.category().contains(moodTag)) {
          score -= 180;
        }
      }
    }
    return score;
  }

  private boolean wantsDining(GenerateRecommendationRequest request) {
    String query = request.query() == null ? "" : request.query().trim().toLowerCase(java.util.Locale.ROOT);
    return query.contains("晚餐")
        || query.contains("氛围晚餐")
        || query.contains("吃饭")
        || query.contains("餐厅")
        || query.contains("正餐")
        || query.contains("约饭")
        || query.contains("吃点")
        || query.contains("下班饭")
        || query.contains("先吃");
  }

  private boolean wantsLodging(GenerateRecommendationRequest request) {
    String query = request.query() == null ? "" : request.query().trim().toLowerCase(java.util.Locale.ROOT);
    return query.contains("酒店")
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
        .toLowerCase(java.util.Locale.ROOT);
  }

  private List<RecommendationPlan> validatePlans(List<RecommendationPlan> plans, List<Poi> candidates) {
    Set<String> allowedPoiIds =
        candidates.stream().map(Poi::id).collect(java.util.stream.Collectors.toSet());
    return plans.stream()
        .map(
            plan ->
                new RecommendationPlan(
                    plan.id(),
                    plan.title(),
                    plan.summary(),
                    plan.tags(),
                    plan.budgetPerPerson(),
                    plan.totalDistanceMeters(),
                    plan.totalDurationMinutes(),
                    plan.routeText(),
                    plan.riskTips(),
                    plan.stops().stream()
                        .filter(stop -> allowedPoiIds.contains(stop.poi().id()))
                        .limit(4)
                        .toList()))
        .filter(plan -> plan.stops().size() >= 2)
        .limit(3)
        .toList();
  }

  private String providerName(List<Poi> candidates) {
    if (candidates.stream().anyMatch(poi -> "amap".equals(poi.source()))) {
      return "amap+ai";
    }
    return "mock";
  }

  private String locationLabel(GenerateRecommendationRequest request) {
    if (request.userLocation() != null
        && request.userLocation().label() != null
        && !request.userLocation().label().isBlank()) {
      return request.userLocation().label();
    }
    if (request.location() != null
        && request.location().label() != null
        && !request.location().label().isBlank()) {
      return request.location().label();
    }
    return request.city() + " · " + request.areaCode();
  }
}
