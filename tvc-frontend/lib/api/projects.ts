import { apiRequest } from "./client";

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Environment {
  id: string;
  project_id: string;
  name: string;
  base_url: string;
  is_source: boolean;
  created_at: string;
}

interface ProjectListResponse {
  data: Project[];
}

interface ProjectDetailResponse {
  data: Project;
  environments: Environment[];
}

export const projectsApi = {
  list(orgId: string) {
    return apiRequest<ProjectListResponse>(
      `/api/v1/projects?organization_id=${orgId}`
    );
  },

  get(id: string) {
    return apiRequest<ProjectDetailResponse>(`/api/v1/projects/${id}`);
  },

  create(data: { name: string; slug?: string; description?: string; organization_id: string }) {
    return apiRequest<Project>(`/api/v1/projects`, {
      method: "POST",
      body: data,
    });
  },

  update(id: string, data: { name?: string; description?: string }) {
    return apiRequest<Project>(`/api/v1/projects/${id}`, {
      method: "PUT",
      body: data,
    });
  },

  delete(id: string) {
    return apiRequest<void>(`/api/v1/projects/${id}`, { method: "DELETE" });
  },
};
