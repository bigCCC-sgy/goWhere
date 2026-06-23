package com.gowhere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class GoWhereApplication {
  public static void main(String[] args) {
    SpringApplication.run(GoWhereApplication.class, args);
  }
}
