package com.gowhere.controller;

import com.gowhere.model.FeedbackRequest;
import com.gowhere.service.FeedbackService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {
  private final FeedbackService feedbackService;

  public FeedbackController(FeedbackService feedbackService) {
    this.feedbackService = feedbackService;
  }

  @PostMapping
  public Map<String, Boolean> create(@Valid @RequestBody FeedbackRequest request) {
    feedbackService.save(request);
    return Map.of("ok", true);
  }
}
