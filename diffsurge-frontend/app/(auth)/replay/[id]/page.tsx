"use client";

import { useQuery } from "@tanstack/react-query";
import { replaysApi } from "@/lib/api/replays";
import { useProject } from "@/lib/providers/project-provider";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const severityColors: Record<string, string> = {
  info: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  breaking: "bg-red-100 text-red-800",
};

function ReplayDetailPageContent() {
  const params = useParams();
  const { activeProject } = useProject();
  const replayId = params.id as string;
  const projectId = activeProject?.id || "";

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["replay-session", projectId, replayId],
    queryFn: () => replaysApi.get(projectId, replayId),
    enabled: !!projectId && !!replayId,
    refetchInterval: (query) =>
      query.state.data?.data.status === "running" ? 3000 : false,
  });

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ["replay-results", projectId, replayId],
    queryFn: () => replaysApi.results(projectId, replayId),
    enabled: !!projectId && !!replayId,
  });

  const session = sessionData?.data;
  const results = resultsData?.data ?? [];

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center text-sm text-zinc-500">
        Replay session not found
      </div>
    );
  }

  const matchRate =
    session.total_requests > 0
      ? ((session.successful_requests / session.total_requests) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/replay"
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            {session.name}
          </h1>
          <p className="text-xs text-zinc-500">
            Created {new Date(session.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {session.status === "running" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-blue-700">
              Replay in progress...
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${
                  session.total_requests > 0
                    ? Math.min(
                        ((session.successful_requests + session.failed_requests) /
                          session.total_requests) *
                          100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-zinc-900">
            {session.total_requests}
          </p>
          <p className="text-xs text-zinc-500">Total requests</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-emerald-600">{matchRate}%</p>
          <p className="text-xs text-zinc-500">Match rate</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-amber-600">
            {session.mismatched_responses}
          </p>
          <p className="text-xs text-zinc-500">Mismatches</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-red-600">
            {session.failed_requests}
          </p>
          <p className="text-xs text-zinc-500">Failures</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-zinc-900">Results</h2>
        </div>
        {resultsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
          </div>
        ) : results.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            No results yet
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  {result.status_match && result.body_match ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : result.error_message ? (
                    <XCircle size={16} className="text-red-500" />
                  ) : (
                    <AlertCircle size={16} className="text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-mono text-zinc-700">
                      {result.original_traffic_log_id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-zinc-500">
                      Status: {result.target_status_code} &middot;{" "}
                      {result.target_latency_ms}ms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.severity && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        severityColors[result.severity] ?? severityColors.info
                      }`}
                    >
                      {result.severity}
                    </span>
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

export default function ReplayDetailPage() {
  return <ReplayDetailPageContent />;
}
