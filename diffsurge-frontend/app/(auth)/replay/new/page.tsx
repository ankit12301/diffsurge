"use client";

import { useState, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { replaysApi } from "@/lib/api/replays";
import { projectsApi } from "@/lib/api/projects";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function NewReplayPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceEnvId, setSourceEnvId] = useState("");
  const [targetEnvId, setTargetEnvId] = useState("");
  const [sampleSize, setSampleSize] = useState(100);

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });

  const environments = projectData?.environments ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      replaysApi.create(projectId, {
        name,
        description,
        source_environment_id: sourceEnvId,
        target_environment_id: targetEnvId,
        sample_size: sampleSize,
      }),
    onSuccess: () => {
      toast.success("Replay session created");
      router.push(`/replay?project=${projectId}`);
    },
    onError: () => toast.error("Failed to create replay session"),
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/replay?project=${projectId}`}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            New Replay Session
          </h1>
          <p className="text-xs text-zinc-500">
            Replay captured traffic against a target environment
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="space-y-4 rounded-xl border border-zinc-100 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Session Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="v2.1 deployment test"
            className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Testing new endpoint changes..."
            className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Source Environment
            </label>
            <select
              value={sourceEnvId}
              onChange={(e) => setSourceEnvId(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="">Select source...</option>
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Target Environment
            </label>
            <select
              value={targetEnvId}
              onChange={(e) => setTargetEnvId(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="">Select target...</option>
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Sample Size
          </label>
          <input
            type="number"
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
            min={1}
            max={10000}
            required
            className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Number of traffic logs to replay (1-10,000)
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Link
            href={`/replay?project=${projectId}`}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Replay"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewReplayPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" /></div>}>
      <NewReplayPageContent />
    </Suspense>
  );
}
