package com.gowhere.controller;

import com.gowhere.model.ResolvedLocation;
import com.gowhere.provider.AmapLocationService;
import java.util.List;
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

  @GetMapping("/suggest")
  public List<ResolvedLocation> suggest(
      @RequestParam String keyword, @RequestParam(required = false) String city) {
    return locationService.suggest(keyword, city);
  }

  @GetMapping("/reverse")
  public ResolvedLocation reverse(@RequestParam double longitude, @RequestParam double latitude) {
    return locationService.reverse(longitude, latitude);
  }
}
