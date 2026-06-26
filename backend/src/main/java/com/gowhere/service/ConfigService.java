package com.gowhere.service;

import com.gowhere.model.AreaConfig;
import com.gowhere.model.SceneConfig;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ConfigService {
  public List<SceneConfig> scenes() {
    return List.of(
        new SceneConfig("eat", "吃饭", "好好吃一顿", "Utensils", List.of("餐厅", "中餐", "西餐")),
        new SceneConfig("hotpot_bbq", "火锅烧烤", "热乎，适合聚", "Flame", List.of("火锅", "烧烤", "串串")),
        new SceneConfig("coffee", "咖啡甜品", "坐一会儿，聊聊天", "Coffee", List.of("咖啡", "甜品", "茶饮")),
        new SceneConfig("afternoon_tea", "下午茶", "轻松坐坐", "CupSoda", List.of("下午茶", "茶饮", "甜品")),
        new SceneConfig("nightlife", "夜宵小酒", "夜里也好收尾", "Moon", List.of("夜宵", "小酒馆", "酒吧")),
        new SceneConfig("local_snack", "地方小吃", "烟火气，随便吃", "Soup", List.of("小吃", "地方菜", "夜市")),
        new SceneConfig("light_meal", "轻食简餐", "快一点，清爽点", "Salad", List.of("轻食", "简餐", "沙拉")),
        new SceneConfig("date_dining", "约会餐厅", "氛围好，不尴尬", "Heart", List.of("餐厅", "西餐", "日料")),
        new SceneConfig("movie", "看电影", "看完还能接着走", "Clapperboard", List.of("电影院")),
        new SceneConfig("ktv", "KTV唱歌", "热闹一点，好收尾", "Mic2", List.of("KTV", "量贩式KTV", "音乐娱乐")),
        new SceneConfig("internet_cafe", "网吧电竞", "开黑，电竞感", "Gamepad2", List.of("网吧", "电竞馆", "电竞酒店")),
        new SceneConfig("billiards_boardgames", "台球棋牌", "轻松玩一会儿", "Dice5", List.of("台球", "棋牌室", "桌游")),
        new SceneConfig("arcade", "游乐场", "轻娱乐，不费脑", "FerrisWheel", List.of("游乐场", "电玩城", "亲子乐园")),
        new SceneConfig("culture", "展览演出", "有内容，也好拍", "Landmark", List.of("展览", "美术馆", "博物馆", "剧院", "演出")),
        new SceneConfig("shopping", "逛商场购物", "买点东西，也吃点", "ShoppingBag", List.of("商场", "购物中心", "步行街")),
        new SceneConfig("walk", "城市漫步", "慢慢走一段", "Footprints", List.of("街区", "公园", "步行街")),
        new SceneConfig("massage", "按摩足疗", "松一松，恢复状态", "HandHeart", List.of("按摩", "足疗", "养生")),
        new SceneConfig("bath_spa", "洗浴汗蒸", "热乎放松一下", "Waves", List.of("洗浴", "汗蒸", "温泉")),
        new SceneConfig("lodging", "酒店住宿", "附近住一晚", "Bed", List.of("酒店", "住宿", "宾馆", "民宿", "快捷酒店", "星级酒店")),
        new SceneConfig("quiet_sit", "安静坐坐", "放空，不被打扰", "Sofa", List.of("咖啡", "书店", "茶馆")),
        new SceneConfig("park_walk", "公园散步", "走走，透透气", "Trees", List.of("公园", "绿地", "景区")),
        new SceneConfig("bookstore_coffee", "书店咖啡", "安静看会儿书", "BookOpen", List.of("书店", "咖啡", "图书馆")),
        new SceneConfig("photo", "拍照出片", "有画面感，别太挤", "Camera", List.of("景点", "街区", "展览")),
        new SceneConfig("sport", "运动放松", "轻运动，恢复状态", "Dumbbell", List.of("运动", "健身", "公园")),
        new SceneConfig("tonight", "今晚随便安排", "别费脑，直接走", "Sparkles", List.of("餐厅", "咖啡", "商场")),
        new SceneConfig("halfday", "半天城市路线", "半天刚刚好", "Route", List.of("景点", "街区", "咖啡")),
        new SceneConfig("date", "约会不尴尬", "自然一点", "Heart", List.of("咖啡", "餐厅", "公园")),
        new SceneConfig("after_work", "下班放松一下", "恢复一点状态", "Sunset", List.of("餐厅", "按摩", "咖啡")),
        new SceneConfig("weekend", "周末轻松逛逛", "有内容，不折腾", "Sun", List.of("展览", "街区", "公园")),
        new SceneConfig("friends", "朋友见面安排", "好聊，方便收尾", "Users", List.of("餐厅", "KTV", "台球")),
        new SceneConfig("rain", "雨天室内方案", "少走路，也舒服", "CloudRain", List.of("商场", "书店", "展览")),
        new SceneConfig("alone", "一个人也舒服", "安静放空一下", "BookOpen", List.of("书店", "咖啡", "公园")),
        new SceneConfig("show", "电影演出", "旧场景兼容", "Ticket", List.of("电影院", "剧院", "演出")),
        new SceneConfig("family", "亲子", "旧场景兼容", "Baby", List.of("亲子", "公园", "商场")),
        new SceneConfig("pet", "宠物友好", "旧场景兼容", "PawPrint", List.of("公园", "宠物友好", "咖啡")),
        new SceneConfig("work", "学习办公", "旧场景兼容", "Laptop", List.of("图书馆", "咖啡", "自习室")));
  }

  public List<AreaConfig> areas() {
    return List.of(
        new AreaConfig("xinjiekou", "南京", "新街口", "秦淮区", 118.784, 32.041, "适合约会、晚餐、咖啡和轻量逛街的城市中心。"),
        new AreaConfig("xuanwu-lake", "南京", "玄武湖", "玄武区", 118.797, 32.071, "适合散步、独处、周末半日和轻户外。"),
        new AreaConfig("laomendong", "南京", "老门东", "秦淮区", 118.795, 32.015, "适合朋友聚会、城市漫游和夜晚氛围路线。"),
        new AreaConfig("hexi", "南京", "河西", "建邺区", 118.728, 32.004, "适合商场、展览、室内活动和雨天安排。"));
  }
}
