package com.gowhere.service;

import com.gowhere.model.FeedbackRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {
  private final List<FeedbackEntry> entries = new ArrayList<>();
  private final StorageService storageService;

  public FeedbackService(StorageService storageService) {
    this.storageService = storageService;
  }

  public synchronized void save(FeedbackRequest request) {
    entries.add(new FeedbackEntry(request.recordId(), request.planId(), request.type(), request.content(), Instant.now()));
    storageService.saveFeedback(request);
  }

  public record FeedbackEntry(String recordId, String planId, String type, String content, Instant createdAt) {}
}
