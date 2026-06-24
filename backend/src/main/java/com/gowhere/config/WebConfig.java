package com.gowhere.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://www.gowhere.bond",
            "https://gowhere.bond",
            "https://go-where-orcin.vercel.app")
        .allowedMethods("GET", "POST", "OPTIONS")
        .allowedHeaders("*");
  }
}
