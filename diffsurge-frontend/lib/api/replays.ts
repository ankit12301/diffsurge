import { apiRequest } from "./client";

export interface ReplaySession {
  id: string;
  project_id: string;
  source_environment_id: string;
  target_environment_id: string;
  name: string;
  description?: string;
  traffic_filter?: Record<string, unknown>;
  sample_size: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  mismatched_responses: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ReplayResult {
  id: string;
  replay_session_id: string;
  original_traffic_log_id: string;
  target_status_code: number;
  target_response_body?: Record<string, unknown>;
  target_latency_ms: number;
  status_match: boolean;
  body_match: boolean;
  diff_report?: Record<string, unknown>;
  severity: string;
  error_message?: string;
  timestamp: string;
}

export const replaysApi = {
  list(projectId: string, status?: string) {
    const params = status ? `?status=${status}` : "";
    return apiRequest<{ data: ReplaySession[] }>(
      `/api/v1/projects/${projectId}/replays${params}`
    );
  },

  get(projectId: string, replayId: string) {
    return apiRequest<{ data: ReplaySession }>(
      `/api/v1/projects/${projectId}/replays/${replayId}`
    );
  },

  create(
    projectId: string,
    data: {
      name: string;
      description?: string;
      source_environment_id: string;
      target_environment_id: string;
      sample_size: number;
      traffic_filter?: Record<string, unknown>;
    }
  ) {
    return apiRequest<ReplaySession>(
      `/api/v1/projects/${projectId}/replays`,
      { method: "POST", body: data }
    );
  },

  start(projectId: string, replayId: string) {
    return apiRequest<{ data: ReplaySession; message: string }>(
      `/api/v1/projects/${projectId}/replays/${replayId}/start`,
      { method: "POST" }
    );
  },

  stop(projectId: string, replayId: string) {
    return apiRequest<{ data: ReplaySession; message: string }>(
      `/api/v1/projects/${projectId}/replays/${replayId}/stop`,
      { method: "POST" }
    );
  },

  results(projectId: string, replayId: string, severity?: string) {
    const params = severity ? `?severity=${severity}` : "";
    return apiRequest<{ data: ReplayResult[] }>(
      `/api/v1/projects/${projectId}/replays/${replayId}/results${params}`
    );
  },
};
