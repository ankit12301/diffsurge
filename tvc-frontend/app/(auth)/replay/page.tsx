"use client";

import { Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { replaysApi } from "@/lib/api/replays";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Play, Square } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-zinc-50 text-zinc-600",
  running: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-amber-50 text-amber-700",
};

function ReplayPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") || "";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["replays", projectId],
    queryFn: () => replaysApi.list(projectId),
    enabled: !!projectId,
  });

  const startMutation = useMutation({
    mutationFn: (replayId: string) => replaysApi.start(projectId, replayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replays", projectId] });
      toast.success("Replay started");
    },
    onError: () => toast.error("Failed to start replay"),
  });

  const stopMutation = useMutation({
    mutationFn: (replayId: string) => replaysApi.stop(projectId, replayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replays", projectId] });
      toast.success("Replay stopped");
    },
    onError: () => toast.error("Failed to stop replay"),
  });

  const sessions = data?.data ?? [];

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-zinc-500">
          Select a project to manage replays
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Replay</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Replay captured traffic against different environments
          </p>
        </div>
        <Link
          href={`/replay/new?project=${projectId}`}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
        >
          <Plus size={14} />
          New Replay
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-zinc-500">No replay sessions yet</p>
            <Link
              href={`/replay/new?project=${projectId}`}
              className="mt-3 inline-flex text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              Create your first replay
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-50"
              >
                <Link
                  href={`/replay/${session.id}?project=${projectId}`}
                  className="flex-1"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[session.status] ?? statusColors.pending
                      }`}
                    >
                      {session.status}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {session.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {session.total_requests} requests &middot;{" "}
                        {session.mismatched_responses} mismatches &middot;{" "}
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  {session.status === "pending" && (
                    <button
                      onClick={() => startMutation.mutate(session.id)}
                      disabled={startMutation.isPending}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
                    >
                      <Play size={12} /> Start
                    </button>
                  )}
                  {session.status === "running" && (
                    <button
                      onClick={() => stopMutation.mutate(session.id)}
                      disabled={stopMutation.isPending}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Square size={12} /> Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" /></div>}>
      <ReplayPageContent />
    </Suspense>
  );
}
