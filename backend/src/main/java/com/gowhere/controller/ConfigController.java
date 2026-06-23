package com.gowhere.controller;

import com.gowhere.model.AreaConfig;
import com.gowhere.model.SceneConfig;
import com.gowhere.service.ConfigService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
public class ConfigController {
  private final ConfigService configService;

  public ConfigController(ConfigService configService) {
    this.configService = configService;
  }

  @GetMapping("/scenes")
  public List<SceneConfig> scenes() {
    return configService.scenes();
  }

  @GetMapping("/areas")
  public List<AreaConfig> areas() {
    return configService.areas();
  }
}
