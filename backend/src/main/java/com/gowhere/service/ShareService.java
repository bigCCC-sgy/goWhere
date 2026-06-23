package com.gowhere.service;

import com.gowhere.model.RecommendationResponse;
import com.gowhere.model.ShareResponse;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class ShareService {
  private final Map<String, RecommendationResponse> snapshots = new ConcurrentHashMap<>();
  private final StorageService storageService;

  public ShareService(StorageService storageService) {
    this.storageService = storageService;
  }

  public ShareResponse create(RecommendationResponse response) {
    String code = "s" + UUID.randomUUID().toString().replace("-", "").substring(0, 9);
    snapshots.put(code, response);
    storageService.saveShareSnapshot(code, response);
    return new ShareResponse(code, "/share/" + code);
  }

  public RecommendationResponse get(String code) {
    RecommendationResponse snapshot = snapshots.get(code);
    if (snapshot != null) {
      return snapshot;
    }
    return storageService.findShareSnapshot(code);
  }
}
