package com.gowhere.model;

import java.util.List;

public record Poi(
    String id,
    String source,
    String sourcePoiId,
    String name,
    String address,
    String city,
    String district,
    double longitude,
    double latitude,
    String category,
    int distanceMeters,
    int avgPrice,
    Double rating,
    String openingHours,
    List<String> tags) {}
