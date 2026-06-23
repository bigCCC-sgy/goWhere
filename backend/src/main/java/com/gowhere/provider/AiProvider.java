package com.gowhere.provider;

import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import com.gowhere.model.RecommendationResponse.RecommendationPlan;
import java.util.List;

public interface AiProvider {
  List<RecommendationPlan> generatePlans(GenerateRecommendationRequest request, List<Poi> candidates);
}
