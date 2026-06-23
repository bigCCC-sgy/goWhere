package com.gowhere.controller;

import com.gowhere.model.RecommendationResponse;
import com.gowhere.model.ShareResponse;
import com.gowhere.service.ShareService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/share")
public class ShareController {
  private final ShareService shareService;

  public ShareController(ShareService shareService) {
    this.shareService = shareService;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ShareResponse create(@RequestBody RecommendationResponse response) {
    return shareService.create(response);
  }

  @GetMapping("/{code}")
  public RecommendationResponse get(@PathVariable String code) {
    RecommendationResponse response = shareService.get(code);
    if (response == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "share snapshot not found");
    }
    return response;
  }
}
