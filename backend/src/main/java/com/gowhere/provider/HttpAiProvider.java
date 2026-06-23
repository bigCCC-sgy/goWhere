package com.gowhere.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.gowhere.config.GoWhereProperties;
import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import com.gowhere.model.RecommendationResponse.PlanStop;
import com.gowhere.model.RecommendationResponse.RecommendationPlan;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class HttpAiProvider implements AiProvider {
  private final GoWhereProperties properties;
  private final MockAiProvider fallback;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public HttpAiProvider(
      GoWhereProperties properties, MockAiProvider fallback, ObjectMapper objectMapper) {
    this.properties = properties;
    this.fallback = fallback;
    this.objectMapper = objectMapper;
    this.httpClient =
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
  }

  @Override
  public List<RecommendationPlan> generatePlans(
      GenerateRecommendationRequest request, List<Poi> candidates) {
    if (candidates.size() < 2) {
      if (mockEnabled()) {
        return fallback.generatePlans(request, candidates);
      }
      throw new IllegalStateException("真实 POI 数量不足，无法生成路线。");
    }

    if (!isEnabled()) {
      if (mockEnabled()) {
        return fallback.generatePlans(request, candidates);
      }
      throw new IllegalStateException("未配置 AI 服务，无法生成真实推荐文案。");
    }

    try {
      List<RecommendationPlan> plans = callAi(request, candidates);
      if (plans.isEmpty()) {
        if (mockEnabled()) {
          return fallback.generatePlans(request, candidates);
        }
        throw new IllegalStateException("AI 返回内容未通过 POI 校验。");
      }
      return plans;
    } catch (Exception exception) {
      if (mockEnabled()) {
        return fallback.generatePlans(request, candidates);
      }
      throw new IllegalStateException("AI 服务调用失败：" + exception.getMessage(), exception);
    }
  }

  private boolean mockEnabled() {
    return properties.recommendation() != null && properties.recommendation().mockEnabled();
  }

  private boolean isEnabled() {
    return properties.ai() != null
        && properties.ai().apiKey() != null
        && !properties.ai().apiKey().isBlank()
        && properties.ai().endpoint() != null
        && !properties.ai().endpoint().isBlank()
        && !"mock".equalsIgnoreCase(properties.ai().provider());
  }

  private List<RecommendationPlan> callAi(
      GenerateRecommendationRequest request, List<Poi> candidates)
      throws IOException, InterruptedException {
    ObjectNode body = objectMapper.createObjectNode();
    body.put("model", properties.ai().model());
    body.put("temperature", 0.72);
    body.put("top_p", 0.86);
    ObjectNode responseFormat = objectMapper.createObjectNode();
    responseFormat.put("type", "json_object");
    body.set("response_format", responseFormat);

    ArrayNode messages = objectMapper.createArrayNode();
    messages.add(message("system", systemPrompt()));
    messages.add(message("user", userPrompt(request, candidates)));
    body.set("messages", messages);

    HttpRequest httpRequest =
        HttpRequest.newBuilder()
            .uri(URI.create(properties.ai().endpoint()))
            .timeout(Duration.ofMillis(Math.max(5000, properties.ai().timeoutMs())))
            .header("Authorization", "Bearer " + properties.ai().apiKey())
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
            .build();

    HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IOException("AI provider returned HTTP " + response.statusCode());
    }

    JsonNode root = objectMapper.readTree(response.body());
    String content = root.path("choices").path(0).path("message").path("content").asText("");
    if (content.isBlank()) {
      throw new IOException("AI provider returned empty content");
    }
    return parsePlans(content, candidates);
  }

  private JsonNode message(String role, String content) {
    ObjectNode node = objectMapper.createObjectNode();
    node.put("role", role);
    node.put("content", content);
    return node;
  }

  private String systemPrompt() {
    return """
        你是《此刻去哪》的城市路线编辑。你只能基于用户给出的候选 POI 生成路线文案，禁止编造地点、地址、价格、评分、距离或营业状态。
        输出必须是严格 JSON，不要 Markdown，不要解释。JSON 结构：
        {
          "plans": [
            {
              "id": "plan-1",
              "title": "18字以内，有生活方式感",
              "summary": "60字以内",
              "tags": ["2到4个短标签"],
              "budgetPerPerson": 120,
              "totalDistanceMeters": 1800,
              "totalDurationMinutes": 180,
              "routeText": "一句路线说明",
              "riskTips": ["1到3条风险提示"],
              "stops": [
                {"poiId": "候选POI里的id", "order": 1, "stayMinutes": 45, "reason": "推荐理由", "riskTip": "可选风险"}
              ]
            }
          ]
        }
        规则：返回 2 到 3 套方案；每套 2 到 4 个地点；每个 poiId 必须来自候选列表；不要输出候选列表外的地点。
        """;
  }

  private String userPrompt(GenerateRecommendationRequest request, List<Poi> candidates)
      throws JsonProcessingException {
    ObjectNode payload = objectMapper.createObjectNode();
    payload.put("city", request.city());
    payload.put("areaCode", request.areaCode());
    payload.put("locationLabel", locationLabel(request));
    payload.set("userLocation", objectMapper.valueToTree(request.userLocation()));
    payload.put("scene", request.scene());
    payload.put("query", request.query());
    payload.put("budget", request.budget());
    payload.put("companions", request.companions());
    payload.set("moodTags", objectMapper.valueToTree(request.moodTags()));
    payload.set("avoidTags", objectMapper.valueToTree(request.avoidTags()));

    ArrayNode poiNodes = objectMapper.createArrayNode();
    candidates.stream()
        .limit(10)
        .forEach(
            poi -> {
              ObjectNode node = objectMapper.createObjectNode();
              node.put("id", poi.id());
              node.put("name", poi.name());
              node.put("address", poi.address());
              node.put("district", poi.district());
              node.put("category", poi.category());
              node.put("distanceMeters", poi.distanceMeters());
              node.put("avgPrice", poi.avgPrice());
              if (poi.rating() != null) {
                node.put("rating", poi.rating());
              }
              node.set("tags", objectMapper.valueToTree(poi.tags()));
              poiNodes.add(node);
            });
    payload.set("candidatePois", poiNodes);
    return "请根据以下 JSON 生成推荐路线，只能使用 candidatePois 中的 id：\n"
        + objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload);
  }

  private List<RecommendationPlan> parsePlans(String content, List<Poi> candidates) throws IOException {
    JsonNode root = objectMapper.readTree(extractJson(content));
    Map<String, Poi> poiById = new HashMap<>();
    candidates.forEach(poi -> poiById.put(poi.id(), poi));

    List<RecommendationPlan> plans = new ArrayList<>();
    for (JsonNode planNode : root.path("plans")) {
      List<PlanStop> stops = new ArrayList<>();
      for (JsonNode stopNode : planNode.path("stops")) {
        Poi poi = poiById.get(stopNode.path("poiId").asText(""));
        if (poi == null) {
          continue;
        }
        int order = Math.max(1, stopNode.path("order").asInt(stops.size() + 1));
        int stayMinutes = Math.max(20, Math.min(180, stopNode.path("stayMinutes").asInt(55)));
        stops.add(
            new PlanStop(
                poi,
                order,
                stayMinutes,
                boundedText(stopNode.path("reason").asText("适合自然衔接这一站。"), 120),
                boundedText(stopNode.path("riskTip").asText(""), 90)));
      }
      stops = stops.stream().sorted(java.util.Comparator.comparingInt(PlanStop::order)).limit(4).toList();
      if (stops.size() < 2) {
        continue;
      }

      int distance =
          planNode.path("totalDistanceMeters").asInt(
              stops.stream().mapToInt(stop -> stop.poi().distanceMeters()).sum());
      int budget =
          planNode.path("budgetPerPerson").asInt(
              (int)
                  Math.round(
                      stops.stream().mapToInt(stop -> stop.poi().avgPrice()).average().orElse(0)));
      int duration =
          planNode.path("totalDurationMinutes").asInt(
              stops.stream().mapToInt(PlanStop::stayMinutes).sum() + (stops.size() - 1) * 15);

      plans.add(
          new RecommendationPlan(
              boundedText(planNode.path("id").asText("plan-" + (plans.size() + 1)), 48),
              boundedText(planNode.path("title").asText("今晚轻松一点的城市路线"), 48),
              boundedText(planNode.path("summary").asText("从真实地点里选出动线更顺的一组安排。"), 120),
              stringList(planNode.path("tags"), List.of("真实POI", "AI路线")),
              Math.max(0, budget),
              Math.max(0, distance),
              Math.max(60, duration),
              boundedText(planNode.path("routeText").asText("按顺序走即可，必要时短途打车衔接。"), 160),
              stringList(planNode.path("riskTips"), List.of("营业时间、价格和排队情况可能变化，请以地图和现场信息为准。")),
              stops));
    }
    return plans.stream().limit(3).toList();
  }

  private String extractJson(String content) throws IOException {
    String trimmed = content.trim();
    if (trimmed.startsWith("```")) {
      trimmed = trimmed.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
    }
    int start = trimmed.indexOf('{');
    int end = trimmed.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new IOException("No JSON object found in AI response");
    }
    return trimmed.substring(start, end + 1);
  }

  private List<String> stringList(JsonNode node, List<String> fallbackValue) {
    if (!node.isArray()) {
      return fallbackValue;
    }
    List<String> values = new ArrayList<>();
    for (JsonNode item : node) {
      String value = boundedText(item.asText(""), 28);
      if (!value.isBlank()) {
        values.add(value);
      }
    }
    return values.isEmpty() ? fallbackValue : values.stream().distinct().limit(4).toList();
  }

  private String boundedText(String text, int maxLength) {
    if (text == null) {
      return "";
    }
    String normalized = text.strip();
    if (normalized.length() <= maxLength) {
      return normalized;
    }
    return normalized.substring(0, maxLength);
  }

  private String locationLabel(GenerateRecommendationRequest request) {
    if (request.userLocation() != null
        && request.userLocation().label() != null
        && !request.userLocation().label().isBlank()) {
      return request.userLocation().label();
    }
    if (request.location() != null
        && request.location().label() != null
        && !request.location().label().isBlank()) {
      return request.location().label();
    }
    return request.city() + " · " + request.areaCode();
  }
}
