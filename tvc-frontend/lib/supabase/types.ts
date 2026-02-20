export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
      };
      user_organizations: {
        Row: {
          user_id: string;
          organization_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "member";
        };
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          config?: Json;
          updated_at?: string;
        };
      };
      environments: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          base_url: string;
          is_source: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          base_url: string;
          is_source?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          base_url?: string;
          is_source?: boolean;
        };
      };
      traffic_logs: {
        Row: {
          id: string;
          project_id: string;
          environment_id: string;
          method: string;
          path: string;
          query_params: Json | null;
          request_headers: Json | null;
          request_body: Json | null;
          status_code: number;
          response_headers: Json | null;
          response_body: Json | null;
          timestamp: string;
          latency_ms: number | null;
          ip_address: string | null;
          user_agent: string | null;
          pii_redacted: boolean;
        };
        Insert: {
          id?: string;
          project_id: string;
          environment_id: string;
          method: string;
          path: string;
          query_params?: Json | null;
          request_headers?: Json | null;
          request_body?: Json | null;
          status_code: number;
          response_headers?: Json | null;
          response_body?: Json | null;
          timestamp?: string;
          latency_ms?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          pii_redacted?: boolean;
        };
        Update: {
          pii_redacted?: boolean;
        };
      };
      replay_sessions: {
        Row: {
          id: string;
          project_id: string;
          source_environment_id: string;
          target_environment_id: string;
          name: string | null;
          description: string | null;
          traffic_filter: Json | null;
          start_time: string | null;
          end_time: string | null;
          sample_size: number | null;
          status: "pending" | "running" | "completed" | "failed";
          total_requests: number;
          successful_requests: number;
          failed_requests: number;
          mismatched_responses: number;
          created_by: string | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          source_environment_id: string;
          target_environment_id: string;
          name?: string | null;
          description?: string | null;
          traffic_filter?: Json | null;
          start_time?: string | null;
          end_time?: string | null;
          sample_size?: number | null;
          status?: "pending" | "running" | "completed" | "failed";
          total_requests?: number;
          successful_requests?: number;
          failed_requests?: number;
          mismatched_responses?: number;
          created_by?: string | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          name?: string | null;
          description?: string | null;
          status?: "pending" | "running" | "completed" | "failed";
          total_requests?: number;
          successful_requests?: number;
          failed_requests?: number;
          mismatched_responses?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      replay_results: {
        Row: {
          id: string;
          replay_session_id: string;
          original_traffic_log_id: string;
          target_status_code: number | null;
          target_response_body: Json | null;
          target_latency_ms: number | null;
          status_match: boolean | null;
          body_match: boolean | null;
          diff_report: Json | null;
          severity: "info" | "warning" | "error" | "breaking" | null;
          error_message: string | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          replay_session_id: string;
          original_traffic_log_id: string;
          target_status_code?: number | null;
          target_response_body?: Json | null;
          target_latency_ms?: number | null;
          status_match?: boolean | null;
          body_match?: boolean | null;
          diff_report?: Json | null;
          severity?: "info" | "warning" | "error" | "breaking" | null;
          error_message?: string | null;
          timestamp?: string;
        };
        Update: {
          target_status_code?: number | null;
          target_response_body?: Json | null;
          target_latency_ms?: number | null;
          status_match?: boolean | null;
          body_match?: boolean | null;
          diff_report?: Json | null;
          severity?: "info" | "warning" | "error" | "breaking" | null;
          error_message?: string | null;
        };
      };
      schema_versions: {
        Row: {
          id: string;
          project_id: string;
          version: string;
          schema_type: "openapi" | "graphql" | "grpc";
          schema_content: Json;
          git_commit: string | null;
          git_branch: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          version: string;
          schema_type: "openapi" | "graphql" | "grpc";
          schema_content: Json;
          git_commit?: string | null;
          git_branch?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          schema_content?: Json;
        };
      };
      schema_diffs: {
        Row: {
          id: string;
          project_id: string;
          from_version_id: string | null;
          to_version_id: string | null;
          diff_report: Json;
          has_breaking_changes: boolean;
          breaking_changes: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          from_version_id?: string | null;
          to_version_id?: string | null;
          diff_report: Json;
          has_breaking_changes?: boolean;
          breaking_changes?: Json | null;
          created_at?: string;
        };
        Update: {
          diff_report?: Json;
          has_breaking_changes?: boolean;
          breaking_changes?: Json | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          tier: "free" | "pro" | "enterprise";
          status: "active" | "cancelled" | "expired";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          monthly_traffic_limit: number | null;
          monthly_replay_limit: number | null;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tier?: "free" | "pro" | "enterprise";
          status?: "active" | "cancelled" | "expired";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          monthly_traffic_limit?: number | null;
          monthly_replay_limit?: number | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tier?: "free" | "pro" | "enterprise";
          status?: "active" | "cancelled" | "expired";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          monthly_traffic_limit?: number | null;
          monthly_replay_limit?: number | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          updated_at?: string;
        };
      };
      usage_tracking: {
        Row: {
          id: string;
          organization_id: string;
          traffic_requests_count: number;
          replay_requests_count: number;
          period_start: string;
          period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          traffic_requests_count?: number;
          replay_requests_count?: number;
          period_start: string;
          period_end: string;
          created_at?: string;
        };
        Update: {
          traffic_requests_count?: number;
          replay_requests_count?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      org_role: "owner" | "admin" | "member";
      replay_status: "pending" | "running" | "completed" | "failed";
      diff_severity: "info" | "warning" | "error" | "breaking";
      schema_type: "openapi" | "graphql" | "grpc";
      subscription_tier: "free" | "pro" | "enterprise";
      subscription_status: "active" | "cancelled" | "expired";
    };
  };
}
