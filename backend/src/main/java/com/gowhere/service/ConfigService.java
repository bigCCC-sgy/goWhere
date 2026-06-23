package com.gowhere.service;

import com.gowhere.model.AreaConfig;
import com.gowhere.model.SceneConfig;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ConfigService {
  public List<SceneConfig> scenes() {
    return List.of(
        new SceneConfig("eat", "吃什么", "下班后舒服一点", "Utensils", List.of("餐厅", "咖啡")),
        new SceneConfig("date", "约会去哪", "自然、不尴尬", "Heart", List.of("咖啡", "餐厅", "公园")),
        new SceneConfig("weekend", "周末去哪", "半日城市漫游", "Sun", List.of("展览", "街区", "公园")),
        new SceneConfig("alone", "一个人去哪", "安静放空", "BookOpen", List.of("书店", "咖啡", "公园")),
        new SceneConfig("rain", "雨天去哪", "室内也好逛", "CloudRain", List.of("商场", "书店", "展览")),
        new SceneConfig("friends", "朋友聚会", "好聊、好吃、好收尾", "Users", List.of("餐厅", "酒馆", "街区")));
  }

  public List<AreaConfig> areas() {
    return List.of(
        new AreaConfig("xinjiekou", "南京", "新街口", "秦淮区", 118.784, 32.041, "适合约会、晚餐、咖啡和轻量逛街的城市中心。"),
        new AreaConfig("xuanwu-lake", "南京", "玄武湖", "玄武区", 118.797, 32.071, "适合散步、独处、周末半日和轻户外。"),
        new AreaConfig("laomendong", "南京", "老门东", "秦淮区", 118.795, 32.015, "适合朋友聚会、城市漫游和夜晚氛围路线。"),
        new AreaConfig("hexi", "南京", "河西", "建邺区", 118.728, 32.004, "适合商场、展览、室内活动和雨天安排。"));
  }
}
