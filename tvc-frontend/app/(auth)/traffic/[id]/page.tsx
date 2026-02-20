"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { trafficApi } from "@/lib/api/traffic";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

function JsonViewer({ data, label }: { data: unknown; label: string }) {
  const [copied, setCopied] = useState(false);

  const jsonStr = data ? JSON.stringify(data, null, 2) : "null";

  function handleCopy() {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-900">{label}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-xs text-zinc-700 font-mono leading-relaxed">
        {jsonStr}
      </pre>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-700">{value}</span>
    </div>
  );
}

function TrafficDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const logId = params.id as string;
  const projectId = searchParams.get("project") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["traffic-log", projectId, logId],
    queryFn: () => trafficApi.get(projectId, logId),
    enabled: !!projectId && !!logId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  const log = data?.data;
  if (!log) {
    return (
      <div className="py-20 text-center text-sm text-zinc-500">
        Traffic log not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/traffic?project=${projectId}`}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">
            <span className="mr-2 text-sm font-bold text-emerald-600">
              {log.method}
            </span>
            <span className="font-mono">{log.path}</span>
          </h1>
          <p className="text-xs text-zinc-500">
            {new Date(log.timestamp).toLocaleString()} &middot; {log.latency_ms}
            ms &middot; Status {log.status_code}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900">Metadata</h3>
        <div className="divide-y divide-zinc-50">
          <MetadataRow label="Request ID" value={log.id} />
          <MetadataRow label="IP Address" value={log.ip_address || "—"} />
          <MetadataRow label="User Agent" value={log.user_agent || "—"} />
          <MetadataRow
            label="PII Redacted"
            value={log.pii_redacted ? "Yes" : "No"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <JsonViewer data={log.request_headers} label="Request Headers" />
        <JsonViewer data={log.response_headers} label="Response Headers" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <JsonViewer data={log.request_body} label="Request Body" />
        <JsonViewer data={log.response_body} label="Response Body" />
      </div>

      {log.query_params && Object.keys(log.query_params).length > 0 && (
        <JsonViewer data={log.query_params} label="Query Parameters" />
      )}
    </div>
  );
}

export default function TrafficDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" /></div>}>
      <TrafficDetailPageContent />
    </Suspense>
  );
}
