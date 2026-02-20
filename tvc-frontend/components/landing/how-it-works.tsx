const steps = [
  {
    number: "01",
    title: "Install & integrate",
    description:
      "Add schema checking to your CI/CD pipeline in under two minutes.",
    code: `$ npm install -g @driftguard/cli
$ driftguard init
  ✓ Config created: .driftguard.yaml
  ✓ CI template generated
$ driftguard schema diff --fail-on-breaking
  ✓ No breaking changes detected`,
  },
  {
    number: "02",
    title: "Capture traffic",
    description:
      "Deploy the proxy alongside your gateway. Smart sampling keeps costs low.",
    code: `$ driftguard proxy start \\
    --target api.example.com \\
    --sample-rate 0.1

  ▸ Proxy listening on :8080
  ▸ Forwarding → api.example.com
  ▸ Sampling 10 % of traffic
  ▸ PII redaction: enabled`,
  },
  {
    number: "03",
    title: "Replay & validate",
    description:
      "Run captured traffic against new builds and review the drift report.",
    code: `$ driftguard replay \\
    --source prod --target staging \\
    --concurrency 100

  ✓ 1,247 requests replayed
  ✓ 1,241 responses matched
  ⚠ 6 diffs detected (0 breaking)
  ▸ Report → https://app.driftguard.dev/r/abc123`,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="max-w-lg">
          <p className="text-[12px] font-medium uppercase tracking-widest text-teal-600">
            How it works
          </p>
          <h2 className="mt-3 text-[1.75rem] font-bold tracking-tight text-gray-900 sm:text-3xl">
            Three steps to safer deploys
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
            Go from zero to production-grade API testing in minutes, not weeks.
          </p>
        </div>

        {/* Steps */}
        <div className="mt-14 space-y-10">
          {steps.map((step) => (
            <div
              key={step.number}
              className="grid items-start gap-8 md:grid-cols-5"
            >
              {/* Text */}
              <div className="flex gap-4 md:col-span-2 md:pt-5">
                <span className="text-[2rem] font-bold leading-none text-gray-200 select-none">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Code block */}
              <div className="md:col-span-3">
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
                    <div className="flex gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                    </div>
                  </div>
                  <pre className="overflow-x-auto bg-[#0f1117] p-5 font-mono text-[12px] leading-[1.7] text-gray-400">
                    {step.code}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
