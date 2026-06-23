package com.gowhere.provider;

import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import java.util.List;

public interface PoiProvider {
  List<Poi> search(GenerateRecommendationRequest request);
}
