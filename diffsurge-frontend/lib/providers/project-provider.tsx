"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi, type Project } from "@/lib/api/projects";
import { useOrganization } from "./organization-provider";

interface ProjectContextValue {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  activeProject: null,
  setActiveProject: () => {},
  isLoading: true,
});

export function useProject() {
  return useContext(ProjectContext);
}

const STORAGE_KEY = "diffsurge_active_project_id";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { activeOrg, isLoading: orgLoading } = useOrganization();
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const {
    data: projectsResponse,
    isLoading: projectsLoading,
  } = useQuery({
    queryKey: ["projects", activeOrg?.id],
    queryFn: () => projectsApi.list(activeOrg!.id),
    enabled: !!activeOrg,
    staleTime: 30_000,
  });

  const projects = projectsResponse?.data ?? [];

  const setActiveProject = useCallback((project: Project) => {
    setActiveProjectState(project);
    try {
      localStorage.setItem(STORAGE_KEY, project.id);
    } catch {}
  }, []);

  // Auto-select logic: restore from localStorage or pick the first/only project
  useEffect(() => {
    if (projects.length === 0) {
      setActiveProjectState(null);
      return;
    }

    // If already selected and still valid, keep it
    if (activeProject && projects.some((p) => p.id === activeProject.id)) {
      return;
    }

    // Try to restore from localStorage
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        const saved = projects.find((p) => p.id === savedId);
        if (saved) {
          setActiveProjectState(saved);
          return;
        }
      }
    } catch {}

    // Auto-select the first project
    setActiveProjectState(projects[0]);
    try {
      localStorage.setItem(STORAGE_KEY, projects[0].id);
    } catch {}
  }, [projects, activeProject]);

  const isLoading = orgLoading || projectsLoading;

  return (
    <ProjectContext.Provider
      value={{ projects, activeProject, setActiveProject, isLoading }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
