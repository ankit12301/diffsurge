import { apiRequest } from "./client";

export interface TrafficLog {
  id: string;
  project_id: string;
  environment_id: string;
  method: string;
  path: string;
  query_params?: Record<string, unknown>;
  request_headers?: Record<string, unknown>;
  request_body?: Record<string, unknown>;
  status_code: number;
  response_headers?: Record<string, unknown>;
  response_body?: Record<string, unknown>;
  timestamp: string;
  latency_ms: number;
  ip_address?: string;
  user_agent?: string;
  pii_redacted: boolean;
}

export interface TrafficStats {
  total_requests: number;
  error_count: number;
  error_rate: number;
  avg_latency_ms: number;
  by_method: Record<string, number>;
  by_status: Record<string, number>;
  period: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    next_cursor?: string;
    has_more: boolean;
    total_estimate?: number;
  };
}

export interface TrafficFilters {
  methods?: string[];
  status_codes?: number[];
  paths?: string[];
  start_time?: string;
  end_time?: string;
}

export const trafficApi = {
  list(projectId: string, filters?: TrafficFilters, cursor?: string, limit = 50) {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursor) params.set("cursor", cursor);
    if (filters?.methods?.length) params.set("methods", filters.methods.join(","));
    if (filters?.status_codes?.length) params.set("status_codes", filters.status_codes.join(","));
    if (filters?.start_time) params.set("start_time", filters.start_time);
    if (filters?.end_time) params.set("end_time", filters.end_time);

    return apiRequest<PaginatedResponse<TrafficLog>>(
      `/api/v1/projects/${projectId}/traffic?${params}`
    );
  },

  get(projectId: string, logId: string) {
    return apiRequest<{ data: TrafficLog }>(
      `/api/v1/projects/${projectId}/traffic/${logId}`
    );
  },

  stats(projectId: string, period = "24h") {
    return apiRequest<{ data: TrafficStats }>(
      `/api/v1/projects/${projectId}/traffic/stats?period=${period}`
    );
  },
};
