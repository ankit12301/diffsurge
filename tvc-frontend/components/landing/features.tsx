import { Shield, Radio, Play, BarChart3, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Shield size={18} />,
    title: "Schema Guardian",
    description:
      "Detect breaking changes in OpenAPI, GraphQL, and JSON schemas before code is merged. Runs in CI with a single command.",
  },
  {
    icon: <Radio size={18} />,
    title: "Traffic Proxy",
    description:
      "Non-invasive reverse proxy captures production traffic with smart sampling and automatic PII redaction. Under 5 ms overhead.",
  },
  {
    icon: <Play size={18} />,
    title: "Replay Engine",
    description:
      "Replay thousands of real requests against staging at 1 000+ RPS. Semantic comparison catches what unit tests miss.",
  },
  {
    icon: <BarChart3 size={18} />,
    title: "Live Dashboard",
    description:
      "Real-time traffic visualisation, replay orchestration, drift reports, and audit logs. One interface for your whole team.",
  },
];

function FeatureCallout() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-8">
      <p className="inline-block rounded-full border border-teal-100 bg-teal-50 px-3 py-0.5 text-[12px] font-medium text-teal-700">
        Smarter checks, safer deploys
      </p>
      <h3 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.7rem]">
        APIs that work harder
        <br />
        than your QA team
      </h3>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-gray-500">
        Behind every deployment is a risk. Driftguard turns your production
        traffic into a regression suite — automatically finding the differences
        that manual testing misses.
      </p>
      <a
        href="#how-it-works"
        className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-teal-600 hover:text-teal-700 transition-colors"
      >
        Learn more <ArrowRight size={14} />
      </a>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="bg-gray-50/60 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Two-column: callout + feature cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left — callout */}
          <FeatureCallout />

          {/* Right — feature grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  {f.icon}
                </div>
                <h4 className="text-[14px] font-semibold text-gray-900">
                  {f.title}
                </h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
