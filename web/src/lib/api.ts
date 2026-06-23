import { areas, scenes } from "./mock-data";
import type { FeedbackType, GenerateRequest, RecommendationResponse, UserLocation } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 12000;

export class ApiError extends Error {
  code: "timeout" | "http" | "network" | "unknown";
  status?: number;

  constructor(message: string, code: ApiError["code"], status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function isTimeoutError(error: unknown) {
  return error instanceof ApiError && error.code === "timeout";
}

export function getApiErrorMessage(error: unknown) {
  if (isTimeoutError(error)) {
    return "生成时间有点久，请稍后重试。";
  }
  if (error instanceof ApiError && error.code === "http") {
    return error.message || "真实推荐服务暂时不可用，请稍后重试。";
  }
  return "无法连接真实推荐服务，请确认后端已启动。";
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), init?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      let message = `Request failed: ${response.status}`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload.message) {
          message = payload.message;
        }
      } catch {
        // Keep the status-based message when the backend does not return JSON.
      }
      throw new ApiError(message, "http", response.status);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out", "timeout");
    }
    throw new ApiError(error instanceof Error ? error.message : "Network request failed", "network");
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function withRealSource(data: RecommendationResponse): RecommendationResponse {
  return { ...data, dataSource: data.dataSource ?? "real", isFallback: false };
}

export async function getScenes() {
  try {
    return await request<typeof scenes>("/api/config/scenes");
  } catch {
    return scenes;
  }
}

export async function getAreas() {
  try {
    return await request<typeof areas>("/api/config/areas");
  } catch {
    return areas;
  }
}

export async function resolveLocation(keyword: string): Promise<UserLocation> {
  const query = keyword.trim();
  if (!query) {
    throw new ApiError("请输入城市、商圈、地址或地标", "unknown");
  }
  return request<UserLocation>(`/api/location/resolve?keyword=${encodeURIComponent(query)}`, {
    timeoutMs: 10000,
  });
}

export async function generateRecommendations(input: GenerateRequest): Promise<RecommendationResponse> {
  return withRealSource(
    await request<RecommendationResponse>("/api/recommendations/generate", {
      method: "POST",
      body: JSON.stringify(input),
      timeoutMs: 45000,
    }),
  );
}

export async function submitFeedback(payload: {
  recordId: string;
  planId?: string;
  type: FeedbackType;
  content?: string;
}) {
  return request<{ ok: boolean }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 8000,
  });
}

export async function createShare(payload: RecommendationResponse) {
  const share = await request<{ code: string; url: string }>("/api/share", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 8000,
  });
  return {
    ...share,
    url:
      typeof window !== "undefined" && share.url.startsWith("/")
        ? `${window.location.origin}${share.url}`
        : share.url,
  };
}

export async function getShare(code: string): Promise<RecommendationResponse | null> {
  try {
    return withRealSource(await request<RecommendationResponse>(`/api/share/${code}`, { timeoutMs: 8000 }));
  } catch {
    return null;
  }
}
