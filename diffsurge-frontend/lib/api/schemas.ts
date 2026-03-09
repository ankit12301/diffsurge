import { apiRequest } from "./client";

export interface SchemaVersion {
  id: string;
  project_id: string;
  version: string;
  schema_type: "openapi" | "graphql";
  schema_content: unknown;
  git_commit?: string;
  git_branch?: string;
  created_at: string;
}

export interface SchemaDiff {
  id: string;
  project_id: string;
  from_version_id: string;
  to_version_id: string;
  diff_report: Record<string, unknown>;
  has_breaking_changes: boolean;
  breaking_changes?: unknown;
  created_at: string;
}

export const schemasApi = {
  list(projectId: string) {
    return apiRequest<{ data: SchemaVersion[] }>(
      `/api/v1/projects/${projectId}/schemas`
    );
  },

  upload(
    projectId: string,
    data: {
      version: string;
      schema_type: string;
      schema_content: unknown;
      git_commit?: string;
      git_branch?: string;
    }
  ) {
    return apiRequest<SchemaVersion>(
      `/api/v1/projects/${projectId}/schemas`,
      { method: "POST", body: data }
    );
  },

  diff(projectId: string, fromVersionId: string, toVersionId: string) {
    return apiRequest<{ data: SchemaDiff }>(
      `/api/v1/projects/${projectId}/schemas/diff`,
      {
        method: "POST",
        body: { from_version_id: fromVersionId, to_version_id: toVersionId },
      }
    );
  },
};
