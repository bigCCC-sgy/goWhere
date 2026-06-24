package com.gowhere.provider;

import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MockPoiProvider implements PoiProvider {
  private static final List<Poi> POIS =
      List.of(
          poi("poi-librairie-avantgarde", "custom-nj-001", "先锋书店五台山总店", "南京市鼓楼区广州路173号", "南京", "鼓楼区", 118.773, 32.051, "书店/咖啡", 980, 45, 4.7, "10:00-21:00", List.of("安静", "有话题", "适合初见", "室内")),
          poi("poi-deji-food", "custom-nj-002", "德基广场餐饮区", "南京市玄武区中山路18号", "南京", "玄武区", 118.785, 32.045, "商场/餐厅", 520, 160, 4.6, "10:00-22:00", List.of("选择多", "交通方便", "预算弹性", "室内")),
          poi("poi-changjiang-road", "custom-nj-003", "长江路文化街区", "南京市玄武区长江路沿线", "南京", "玄武区", 118.793, 32.047, "街区", 780, 0, 4.5, "全天", List.of("散步", "城市感", "自然收尾")),
          poi("poi-jinling-library", "custom-nj-004", "金陵图书馆", "南京市建邺区乐山路158号", "南京", "建邺区", 118.724, 32.003, "图书馆", 450, 0, 4.7, "09:00-17:30", List.of("安静", "室内", "省钱")),
          poi("poi-poly-theatre", "custom-nj-005", "南京保利大剧院周边展演空间", "南京市建邺区邺城路6号", "南京", "建邺区", 118.721, 32.009, "展演空间", 680, 80, 4.6, "以展演信息为准", List.of("室内", "出片", "不赶")),
          poi("poi-golden-eagle-world", "custom-nj-006", "金鹰世界", "南京市建邺区应天大街888号", "南京", "建邺区", 118.736, 32.012, "商场/餐厅", 1100, 120, 4.5, "10:00-22:00", List.of("选择多", "室内", "好收尾")),
          poi("poi-laomendong", "custom-nj-007", "老门东历史街区", "南京市秦淮区剪子巷54号", "南京", "秦淮区", 118.795, 32.015, "街区/小吃", 900, 75, 4.6, "全天", List.of("朋友", "夜游", "小吃")),
          poi("poi-xuanwu-lake", "custom-nj-008", "玄武湖公园", "南京市玄武区玄武巷1号", "南京", "玄武区", 118.797, 32.071, "公园", 1300, 0, 4.8, "06:00-22:00", List.of("散步", "放空", "低预算")));

  @Override
  public List<Poi> search(GenerateRecommendationRequest request) {
    List<Poi> matched =
        POIS.stream()
        .filter(poi -> poi.city().equals(request.city()))
        .sorted(Comparator.comparingInt(poi -> score(request, poi)))
        .limit(8)
        .toList();
    if (!matched.isEmpty()) {
      return matched;
    }
    return POIS.stream().sorted(Comparator.comparingInt(poi -> score(request, poi))).limit(8).toList();
  }

  private int score(GenerateRecommendationRequest request, Poi poi) {
    int score = poi.distanceMeters();
    if (request.scene().equals("rain") && poi.tags().contains("室内")) {
      score -= 500;
    }
    if (request.scene().equals("alone") && poi.tags().contains("安静")) {
      score -= 400;
    }
    if (request.scene().equals("date") && poi.tags().contains("适合初见")) {
      score -= 400;
    }
    if (request.budget() > 0 && poi.avgPrice() > request.budget()) {
      score += 800;
    }
    return score;
  }

  private static Poi poi(
      String id,
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
      List<String> tags) {
    return new Poi(
        id,
        "custom",
        sourcePoiId,
        name,
        address,
        city,
        district,
        longitude,
        latitude,
        category,
        distanceMeters,
        avgPrice,
        rating,
        openingHours,
        tags,
        List.of(),
        "",
        "",
        "",
        "https://uri.amap.com/search?keyword=" + name);
  }
}
