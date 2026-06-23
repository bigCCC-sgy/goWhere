package com.gowhere.model;

public record AreaConfig(
    String code,
    String city,
    String name,
    String district,
    double longitude,
    double latitude,
    String description) {}
