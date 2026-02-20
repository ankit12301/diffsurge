import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

function TerminalMockup() {
  return (
    <div className="relative w-full">
      {/* Soft glow */}
      <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-teal-50 to-gray-50 blur-2xl opacity-60" />

      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.06)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
            <div className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
            <div className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-gray-400">
            terminal
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-[#0f1117] p-5 font-mono text-[12.5px] leading-[1.7]">
          <p className="text-gray-500">
            <span className="text-teal-400">$</span> driftguard schema diff
            --old api-v1.yaml --new api-v2.yaml
          </p>
          <p className="mt-3 text-gray-500">Comparing schemas…</p>

          <div className="mt-3 space-y-2.5">
            <div>
              <span className="font-semibold text-red-400">✗ BREAKING</span>
              <span className="text-gray-300">
                {"  "}POST /api/users
              </span>
              <p className="ml-4 text-gray-500">
                └─ Required field removed:{" "}
                <span className="text-red-300">&quot;email_verified&quot;</span>
              </p>
            </div>
            <div>
              <span className="font-semibold text-yellow-400">⚠ WARNING</span>
              <span className="text-gray-300">
                {"  "}GET /api/users/:id
              </span>
              <p className="ml-4 text-gray-500">
                └─ Type changed:{" "}
                <span className="text-yellow-200">&quot;age&quot;</span> string →
                number
              </p>
            </div>
            <div>
              <span className="font-semibold text-emerald-400">✓ SAFE</span>
              <span className="text-gray-300">
                {"    "}GET /api/products
              </span>
              <p className="ml-4 text-gray-500">
                └─ Optional field added:{" "}
                <span className="text-emerald-300">
                  &quot;metadata&quot;
                </span>
              </p>
            </div>
          </div>

          <div className="mt-3 border-t border-gray-800 pt-3 text-gray-500">
            Found <span className="text-red-400">1 breaking</span>,{" "}
            <span className="text-yellow-400">1 warning</span>,{" "}
            <span className="text-emerald-400">1 safe</span> change
          </div>
          <p className="text-gray-600">
            Exit code: 1 (breaking changes detected)
          </p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative bg-white pt-[100px] pb-16 md:pt-[140px] md:pb-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 md:grid-cols-2 md:gap-16">
        {/* Left — copy */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[12px] font-medium text-gray-500">
              Now in Public Beta
            </span>
          </div>

          <h1 className="text-[2.5rem] leading-[1.1] font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem]">
            Every API change
            <br />
            <span className="text-gradient">becomes visible</span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-gray-500">
            Capture production traffic, replay it against staging, and catch
            breaking changes before they reach your users. Schema diffing, traffic
            replay, and drift reports — in one tool.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg">
              Start for free
              <ArrowRight size={15} />
            </Button>
            <Button variant="secondary" size="lg">
              Book a Demo
            </Button>
          </div>
        </div>

        {/* Right — terminal */}
        <div className="relative">
          <TerminalMockup />
        </div>
      </div>
    </section>
  );
}
