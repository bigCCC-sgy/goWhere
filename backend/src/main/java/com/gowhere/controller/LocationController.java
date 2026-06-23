package com.gowhere.controller;

import com.gowhere.model.ResolvedLocation;
import com.gowhere.provider.AmapLocationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/location")
public class LocationController {
  private final AmapLocationService locationService;

  public LocationController(AmapLocationService locationService) {
    this.locationService = locationService;
  }

  @GetMapping("/resolve")
  public ResolvedLocation resolve(@RequestParam String keyword) {
    return locationService.resolve(keyword);
  }
}
