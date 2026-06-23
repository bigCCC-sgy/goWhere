package com.gowhere.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gowhere.config.GoWhereProperties;
import com.gowhere.model.FeedbackRequest;
import com.gowhere.model.GenerateRecommendationRequest;
import com.gowhere.model.Poi;
import com.gowhere.model.RecommendationResponse;
import com.gowhere.model.RecommendationResponse.RecommendationPlan;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class StorageService {
  private final GoWhereProperties properties;
  private final ObjectMapper objectMapper;

  public StorageService(GoWhereProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  public boolean enabled() {
    return properties.database() != null
        && properties.database().url() != null
        && !properties.database().url().isBlank();
  }

  public void saveRecommendation(
      GenerateRecommendationRequest request,
      RecommendationResponse response,
      List<Poi> candidates,
      String provider) {
    if (!enabled()) {
      return;
    }
    try (Connection connection = connection()) {
      connection.setAutoCommit(false);
      insertRecommendationRecord(connection, request, response.recordId(), provider);
      for (RecommendationPlan plan : response.plans()) {
        insertPlan(connection, response.recordId(), plan);
      }
      for (Poi poi : candidates) {
        upsertPoi(connection, poi);
      }
      connection.commit();
    } catch (Exception ignored) {
      // Persistence must not break the no-login recommendation flow.
    }
  }

  public void saveFeedback(FeedbackRequest request) {
    if (!enabled()) {
      return;
    }
    try (Connection connection = connection();
        PreparedStatement statement =
            connection.prepareStatement(
                "INSERT INTO feedback(record_id, plan_id, type, content, created_at) VALUES(?,?,?,?,NOW())")) {
      statement.setString(1, request.recordId());
      statement.setString(2, request.planId());
      statement.setString(3, request.type());
      statement.setString(4, request.content());
      statement.executeUpdate();
    } catch (Exception ignored) {
      // Feedback is opportunistic in MVP; the caller still gets a usable response.
    }
  }

  public void saveShareSnapshot(String code, RecommendationResponse response) {
    if (!enabled()) {
      return;
    }
    try (Connection connection = connection();
        PreparedStatement statement =
            connection.prepareStatement(
                """
                INSERT INTO share_snapshot(code, record_id, snapshot_json, created_at)
                VALUES(?,?,?,NOW())
                ON DUPLICATE KEY UPDATE snapshot_json=VALUES(snapshot_json), record_id=VALUES(record_id)
                """)) {
      statement.setString(1, code);
      statement.setString(2, response.recordId());
      statement.setString(3, toJson(response));
      statement.executeUpdate();
    } catch (Exception ignored) {
      // In-memory share snapshots still cover the current local session.
    }
  }

  public RecommendationResponse findShareSnapshot(String code) {
    if (!enabled()) {
      return null;
    }
    try (Connection connection = connection();
        PreparedStatement statement =
            connection.prepareStatement(
                "SELECT snapshot_json FROM share_snapshot WHERE code=? AND (expires_at IS NULL OR expires_at > NOW())")) {
      statement.setString(1, code);
      try (ResultSet rs = statement.executeQuery()) {
        if (rs.next()) {
          return objectMapper.readValue(rs.getString(1), RecommendationResponse.class);
        }
      }
    } catch (Exception ignored) {
      return null;
    }
    return null;
  }

  private void insertRecommendationRecord(
      Connection connection, GenerateRecommendationRequest request, String recordId, String provider)
      throws SQLException, JsonProcessingException {
    try (PreparedStatement statement =
        connection.prepareStatement(
            """
            INSERT INTO recommendation_record(
              record_id, city, area_code, scene, query_text, budget, companions,
              mood_tags, avoid_tags, fuzzy_location, provider, created_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW())
            """)) {
      statement.setString(1, recordId);
      statement.setString(2, request.city());
      statement.setString(3, request.areaCode());
      statement.setString(4, request.scene());
      statement.setString(5, request.query());
      statement.setInt(6, request.budget());
      statement.setString(7, request.companions());
      statement.setString(8, toJson(request.moodTags()));
      statement.setString(9, toJson(request.avoidTags()));
      statement.setString(10, locationLabel(request));
      statement.setString(11, provider);
      statement.executeUpdate();
    }
  }

  private void insertPlan(Connection connection, String recordId, RecommendationPlan plan)
      throws SQLException, JsonProcessingException {
    try (PreparedStatement statement =
        connection.prepareStatement(
            """
            INSERT INTO recommendation_plan(
              record_id, plan_id, title, summary, tags, budget_per_person,
              total_distance_meters, total_duration_minutes, route_text, risk_tips, stops_json, created_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW())
            """)) {
      statement.setString(1, recordId);
      statement.setString(2, plan.id());
      statement.setString(3, plan.title());
      statement.setString(4, plan.summary());
      statement.setString(5, toJson(plan.tags()));
      statement.setInt(6, plan.budgetPerPerson());
      statement.setInt(7, plan.totalDistanceMeters());
      statement.setInt(8, plan.totalDurationMinutes());
      statement.setString(9, plan.routeText());
      statement.setString(10, toJson(plan.riskTips()));
      statement.setString(11, toJson(plan.stops()));
      statement.executeUpdate();
    }
  }

  private void upsertPoi(Connection connection, Poi poi) throws SQLException, JsonProcessingException {
    try (PreparedStatement statement =
        connection.prepareStatement(
            """
            INSERT INTO poi_cache(
              poi_id, source, source_poi_id, name, address, city, district, longitude, latitude,
              category, distance_meters, avg_price, rating, opening_hours, tags, raw_json, cached_at
            ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
            ON DUPLICATE KEY UPDATE
              name=VALUES(name), address=VALUES(address), distance_meters=VALUES(distance_meters),
              avg_price=VALUES(avg_price), rating=VALUES(rating), tags=VALUES(tags), raw_json=VALUES(raw_json),
              cached_at=NOW()
            """)) {
      statement.setString(1, poi.id());
      statement.setString(2, poi.source());
      statement.setString(3, poi.sourcePoiId());
      statement.setString(4, poi.name());
      statement.setString(5, poi.address());
      statement.setString(6, poi.city());
      statement.setString(7, poi.district());
      statement.setDouble(8, poi.longitude());
      statement.setDouble(9, poi.latitude());
      statement.setString(10, poi.category());
      statement.setInt(11, poi.distanceMeters());
      statement.setInt(12, poi.avgPrice());
      if (poi.rating() == null) {
        statement.setObject(13, null);
      } else {
        statement.setDouble(13, poi.rating());
      }
      statement.setString(14, poi.openingHours());
      statement.setString(15, toJson(poi.tags()));
      statement.setString(16, toJson(poi));
      statement.executeUpdate();
    }
  }

  private Connection connection() throws SQLException {
    GoWhereProperties.Database database = properties.database();
    String username = database.username() == null ? "" : database.username();
    String password = database.password() == null ? "" : database.password();
    return DriverManager.getConnection(database.url(), username, password);
  }

  private String toJson(Object value) throws JsonProcessingException {
    if (value == null) {
      return "[]";
    }
    return objectMapper.writeValueAsString(value);
  }

  private String locationLabel(GenerateRecommendationRequest request) {
    if (request.userLocation() != null) {
      if (request.userLocation().label() != null && !request.userLocation().label().isBlank()) {
        return request.userLocation().label();
      }
      if (request.userLocation().address() != null && !request.userLocation().address().isBlank()) {
        return request.userLocation().address();
      }
    }
    if (request.location() != null && request.location().label() != null && !request.location().label().isBlank()) {
      return request.location().label();
    }
    return request.location() == null && request.userLocation() == null ? null : "provided";
  }

  public record FeedbackEntry(
      String recordId, String planId, String type, String content, Instant createdAt) {}
}
