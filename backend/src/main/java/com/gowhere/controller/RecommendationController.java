package com.gowhere.controller;

import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.RecommendationResponse;
import com.gowhere.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
  private final RecommendationService recommendationService;

  public RecommendationController(RecommendationService recommendationService) {
    this.recommendationService = recommendationService;
  }

  @PostMapping("/generate")
  public RecommendationResponse generate(@Valid @RequestBody GenerateRecommendationRequest request) {
    return recommendationService.generate(request);
  }
}
