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
        new SceneConfig("friends", "朋友聚会", "好聊、好吃、好收尾", "Users", List.of("餐厅", "酒馆", "街区")),
        new SceneConfig("coffee", "咖啡甜品", "坐一会儿，聊聊天", "Coffee", List.of("咖啡", "甜品")),
        new SceneConfig("culture", "看展", "有内容，也好拍", "Landmark", List.of("展览", "美术馆", "博物馆")),
        new SceneConfig("show", "电影演出", "看完还能接着走", "Ticket", List.of("电影院", "剧院", "演出")),
        new SceneConfig("walk", "城市漫步", "慢慢走一段", "Footprints", List.of("街区", "公园", "景点")),
        new SceneConfig("nightlife", "夜生活", "小酌、夜游、收尾", "Moon", List.of("酒吧", "夜市", "街区")),
        new SceneConfig("family", "亲子", "轻松、安全、少折腾", "Baby", List.of("亲子", "公园", "商场")),
        new SceneConfig("pet", "宠物友好", "带宠也自在", "PawPrint", List.of("公园", "宠物友好", "咖啡")),
        new SceneConfig("work", "学习办公", "安静、插座、久坐", "Laptop", List.of("图书馆", "咖啡", "自习室")),
        new SceneConfig("sport", "运动放松", "轻运动，恢复状态", "Dumbbell", List.of("运动", "健身", "公园")),
        new SceneConfig("shopping", "购物逛街", "买点东西，也吃点", "ShoppingBag", List.of("商场", "购物", "餐厅")),
        new SceneConfig("photo", "拍照出片", "有画面感，别太挤", "Camera", List.of("景点", "街区", "展览")),
        new SceneConfig("halfday", "短途半日", "轻计划，不赶路", "Route", List.of("景点", "街区", "咖啡")),
        new SceneConfig("lodging", "住宿/住一晚", "附近过夜，安心休息", "Bed", List.of("酒店", "民宿", "宾馆")));
  }

  public List<AreaConfig> areas() {
    return List.of(
        new AreaConfig("xinjiekou", "南京", "新街口", "秦淮区", 118.784, 32.041, "适合约会、晚餐、咖啡和轻量逛街的城市中心。"),
        new AreaConfig("xuanwu-lake", "南京", "玄武湖", "玄武区", 118.797, 32.071, "适合散步、独处、周末半日和轻户外。"),
        new AreaConfig("laomendong", "南京", "老门东", "秦淮区", 118.795, 32.015, "适合朋友聚会、城市漫游和夜晚氛围路线。"),
        new AreaConfig("hexi", "南京", "河西", "建邺区", 118.728, 32.004, "适合商场、展览、室内活动和雨天安排。"));
  }
}
