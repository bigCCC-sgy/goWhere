# 《此刻去哪》MVP API 草案

Base URL: `http://localhost:8080`

## GET /api/config/scenes

返回六大场景配置。

## GET /api/config/areas

返回城市和商圈配置。第一期仍保留预设配置，但用户推荐位置不再受这些预设限制。

## GET /api/location/resolve

解析用户手动输入的城市、商圈、地址或地标，返回可用于推荐的统一位置对象。

```json
{
  "label": "上海市 · 静安区 · 静安寺",
  "city": "上海市",
  "district": "静安区",
  "address": "南京西路1686号",
  "keyword": "上海 静安寺",
  "longitude": 121.445,
  "latitude": 31.224,
  "source": "manual"
}
```

## POST /api/recommendations/generate

生成游客推荐方案。

请求体：

```json
{
  "city": "南京",
  "areaCode": "xinjiekou",
  "userLocation": {
    "label": "上海市 · 静安区 · 静安寺",
    "city": "上海市",
    "district": "静安区",
    "keyword": "上海 静安寺",
    "longitude": 121.445,
    "latitude": 31.224,
    "source": "manual"
  },
  "scene": "date",
  "query": "第一次约会，预算300，不想太吵",
  "budget": 300,
  "companions": "date",
  "moodTags": ["安静", "自然"],
  "avoidTags": ["太吵"],
  "location": {
    "longitude": 118.784,
    "latitude": 32.041
  }
}
```

响应体：

```json
{
  "recordId": "rec_123",
  "requestSummary": "南京 · 新街口 · 第一次约会",
  "plans": []
}
```

## POST /api/feedback

提交反馈。

## POST /api/share

基于推荐记录或方案快照创建分享链接。

## GET /api/share/{code}

读取分享快照。
