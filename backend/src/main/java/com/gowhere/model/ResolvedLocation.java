package com.gowhere.model;

public record ResolvedLocation(
    String label,
    String city,
    String district,
    String address,
    String keyword,
    Double longitude,
    Double latitude,
    String source) {}
