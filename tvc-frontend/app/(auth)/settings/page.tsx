"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Settings, Plus, FolderOpen } from "lucide-react";

export default function SettingsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [orgId, setOrgId] = useState("");
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name: projectName,
        description,
        organization_id: orgId,
      }),
    onSuccess: (project) => {
      toast.success("Project created");
      setShowCreate(false);
      router.push(`/dashboard?project=${project.id}`);
    },
    onError: () => toast.error("Failed to create project"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Manage your projects and organization
        </p>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Projects</h2>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <Plus size={12} />
            New Project
          </button>
        </div>

        {showCreate && (
          <div className="border-b border-zinc-100 p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Organization ID
                </label>
                <input
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  required
                  placeholder="UUID of your organization"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Project Name
                </label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  placeholder="My API"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">
                  Description
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="p-5">
          <div className="flex flex-col items-center py-8">
            <Settings size={28} className="mb-3 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              Create a project to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
