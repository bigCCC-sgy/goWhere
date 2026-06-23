# 住宿意图手动验证

## 用例

- 城市：滁州市
- 区域：南谯区
- 位置：滁州奥体中心
- 场景：friends
- Query：晚上看完演唱会，去酒店，推荐酒店

## 请求

```http
POST /api/recommendations/generate
Content-Type: application/json; charset=utf-8
```

```json
{
  "city": "滁州市",
  "areaCode": "manual",
  "scene": "friends",
  "query": "晚上看完演唱会，去酒店，推荐酒店",
  "budget": 500,
  "companions": "friends",
  "moodTags": ["过夜", "演出后休息"],
  "avoidTags": ["太吵"],
  "userLocation": {
    "label": "滁州市 · 南谯区 · 滁州奥体中心",
    "city": "滁州市",
    "district": "南谯区",
    "keyword": "滁州奥体中心",
    "longitude": 118.33387,
    "latitude": 32.25561,
    "source": "manual"
  }
}
```

## 预期

- 返回的 `plans[].stops[].poi.source` 应包含 `amap`。
- 返回的 `plans[].stops[].poi.category/name/tags` 应体现住宿类地点，例如酒店、住宿、宾馆、民宿、旅馆、客栈、公寓酒店等。
- 不应生成以餐厅、咖啡、甜品、小吃、酒吧、商场为主体的路线。
- AI 仍只能使用 `candidatePois` 中的 POI，后端 `validatePlans` 不放宽校验。

## 2026-06-22 验证记录

本地临时后端进程 + 真实高德服务验证通过：最终路线中返回了高德来源的民宿/旅馆招待所类 POI，标签包含“住宿”“过夜”“演出后休息”。
