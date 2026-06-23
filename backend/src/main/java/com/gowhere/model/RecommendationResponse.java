package com.gowhere.model;

import java.util.List;

public record RecommendationResponse(
    String recordId,
    String requestSummary,
    String aiNotice,
    List<RecommendationPlan> plans) {

  public record RecommendationPlan(
      String id,
      String title,
      String summary,
      List<String> tags,
      int budgetPerPerson,
      int totalDistanceMeters,
      int totalDurationMinutes,
      String routeText,
      List<String> riskTips,
      List<PlanStop> stops) {}

  public record PlanStop(Poi poi, int order, int stayMinutes, String reason, String riskTip) {}
}
