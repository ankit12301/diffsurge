"use client";

import { FadeIn } from "@/components/ui/fade-in";
import {
  AlertTriangle,
  ArrowRightLeft,
  Trash2,
  Plus,
  Layers,
  Timer,
  Hash,
  ShieldAlert,
  Terminal,
  Server,
  Container,
  Cpu,
} from "lucide-react";

const catches = [
  {
    icon: <Trash2 size={16} />,
    title: "Removed fields",
    description: "A required field is removed from a response body",
    severity: "breaking",
  },
  {
    icon: <ArrowRightLeft size={16} />,
    title: "Type changes",
    description: "A field type changes — string becomes number",
    severity: "breaking",
  },
  {
    icon: <AlertTriangle size={16} />,
    title: "Deleted endpoints",
    description: "An endpoint is renamed or removed entirely",
    severity: "breaking",
  },
  {
    icon: <Plus size={16} />,
    title: "New required params",
    description: "A new required query parameter is added",
    severity: "breaking",
  },
  {
    icon: <Layers size={16} />,
    title: "Shape changes",
    description: "A nested object structure changes its shape",
    severity: "warning",
  },
  {
    icon: <Timer size={16} />,
    title: "Latency regressions",
    description: "Response time regresses beyond a threshold",
    severity: "warning",
  },
  {
    icon: <Hash size={16} />,
    title: "Status code drift",
    description: "A status code changes for identical requests",
    severity: "warning",
  },
  {
    icon: <ShieldAlert size={16} />,
    title: "PII leaks",
    description: "PII appears in a field that was previously clean",
    severity: "info",
  },
];

const platforms = [
  { icon: <Terminal size={16} />, name: "macOS" },
  { icon: <Terminal size={16} />, name: "Linux" },
  { icon: <Terminal size={16} />, name: "Windows" },
  { icon: <Container size={16} />, name: "Docker" },
  { icon: <Server size={16} />, name: "CI/CD" },
  { icon: <Cpu size={16} />, name: "Kubernetes" },
];

const severityStyles = {
  breaking: "border-red-100 bg-red-50/50 text-red-500",
  warning: "border-amber-100 bg-amber-50/50 text-amber-500",
  info: "border-teal-100 bg-teal-50/50 text-teal-500",
};

const severityBadge = {
  breaking: "bg-red-100 text-red-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-teal-100 text-teal-600",
};

export function Capabilities() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[12px] font-medium uppercase tracking-widest text-teal-600">
              What Driftsurge catches
            </p>
            <h2 className="mt-3 text-[1.75rem] font-bold tracking-tight sm:text-3xl">
              The breaking changes that slip through unit tests
            </h2>
            <p className="mt-4 text-[14px] leading-[1.7] text-zinc-500">
              Unit tests verify logic. Integration tests verify contracts.
              Driftsurge replays actual production traffic against your new
              build — catching real-world mismatches before your users do.
            </p>
          </div>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {catches.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.05}>
              <div
                className={`group relative rounded-xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  severityStyles[item.severity as keyof typeof severityStyles]
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm border border-zinc-100">
                    {item.icon}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      severityBadge[item.severity as keyof typeof severityBadge]
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
                  {item.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-8 md:p-10">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-widest text-teal-600">
                  Runs everywhere
                </p>
                <h3 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                  Works with your stack, not against it
                </h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-zinc-500">
                  A single binary with zero dependencies. Drop it into your
                  CI/CD pipeline with one line — standard exit codes mean your
                  workflow blocks automatically on breaking changes. The traffic
                  proxy deploys as a sidecar or standalone container with less
                  than 5ms overhead.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {platforms.map((p) => (
                  <div
                    key={p.name}
                    className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                      {p.icon}
                    </div>
                    <span className="text-[12px] font-medium text-zinc-600">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
