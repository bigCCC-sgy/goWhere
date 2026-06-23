package com.gowhere.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GenerateRecommendationRequest(
    @NotBlank String city,
    @NotBlank String areaCode,
    @NotBlank String scene,
    @NotBlank @Size(min = 1, max = 200) String query,
    @Min(0) @Max(9999) int budget,
    @NotBlank String companions,
    List<String> moodTags,
    List<String> avoidTags,
    Location location,
    UserLocation userLocation) {
  public record Location(
      Double longitude,
      Double latitude,
      String label,
      String city,
      String district,
      String address,
      String source) {}

  public record UserLocation(
      String label,
      String city,
      String district,
      String address,
      String keyword,
      Double longitude,
      Double latitude,
      String source) {}
}
