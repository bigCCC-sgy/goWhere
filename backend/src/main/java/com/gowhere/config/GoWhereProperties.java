package com.gowhere.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gowhere")
public record GoWhereProperties(Amap amap, Ai ai, Database database, Recommendation recommendation) {
  public record Amap(String webServiceKey, int radiusMeters) {}

  public record Ai(String provider, String endpoint, String apiKey, String model, int timeoutMs) {}

  public record Database(String url, String username, String password) {}

  public record Recommendation(boolean mockEnabled) {}
}
