package com.gowhere.provider;

import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import com.gowhere.model.RecommendationResponse.PlanStop;
import com.gowhere.model.RecommendationResponse.RecommendationPlan;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MockAiProvider implements AiProvider {
  @Override
  public List<RecommendationPlan> generatePlans(GenerateRecommendationRequest request, List<Poi> candidates) {
    List<Poi> first = candidates.stream().limit(3).toList();
    List<Poi> second = candidates.stream().skip(Math.min(3, candidates.size())).limit(3).toList();
    List<RecommendationPlan> plans = new ArrayList<>();

    if (!first.isEmpty()) {
      plans.add(toPlan("plan-" + request.scene() + "-soft", titleFor(request.scene()), summaryFor(request.scene()), List.of("真实 POI", "动线紧凑", "AI 文案"), first));
    }
    if (!second.isEmpty()) {
      plans.add(toPlan("plan-" + request.scene() + "-alt", "更松弛的一条备选路线", "把节奏放慢一点，适合不想赶场的半日安排。", List.of("备选", "低压力", "可调整"), second));
    }
    return plans;
  }

  private RecommendationPlan toPlan(String id, String title, String summary, List<String> tags, List<Poi> pois) {
    int budget = Math.max(0, (int) Math.round(pois.stream().mapToInt(Poi::avgPrice).average().orElse(0)));
    int distance = pois.stream().mapToInt(Poi::distanceMeters).sum();
    List<PlanStop> stops = new ArrayList<>();
    for (int i = 0; i < pois.size(); i++) {
      Poi poi = pois.get(i);
      stops.add(new PlanStop(poi, i + 1, i == 0 ? 55 : 75, reasonFor(poi, i), poi.tags().contains("室内") ? null : "天气变化时请以现场和地图信息为准。"));
    }
    return new RecommendationPlan(id, title, summary, tags, budget, distance, 60 + pois.size() * 50, "路线集中，适合步行与短途打车结合。", List.of("营业时间、价格和排队情况可能变化。"), stops);
  }

  private String titleFor(String scene) {
    return switch (scene) {
      case "date" -> "轻松不尴尬的第一次见面路线";
      case "rain" -> "雨天也舒展的室内半日";
      case "alone" -> "一个人慢慢恢复能量的路线";
      case "friends" -> "朋友见面好聊好收尾路线";
      case "weekend" -> "周末半日城市漫游";
      default -> "下班后舒服一点的晚餐路线";
    };
  }

  private String summaryFor(String scene) {
    return switch (scene) {
      case "date" -> "先坐下来聊天，再自然过渡到晚餐和散步。";
      case "rain" -> "把室内空间串起来，减少淋雨和无效奔波。";
      case "alone" -> "低噪音、低压力，适合一个人待一会儿。";
      default -> "不用做太多决定，跟着路线走就好。";
    };
  }

  private String reasonFor(Poi poi, int index) {
    if (index == 0) {
      return "适合作为第一站，进入状态很轻，不会一开始就有压力。";
    }
    return "和上一站距离适中，可以自然衔接，也保留临时调整空间。";
  }
}
