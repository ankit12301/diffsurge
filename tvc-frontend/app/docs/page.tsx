import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import {
  Terminal,
  Download,
  FileJson,
  Play,
  Server,
  Shield,
  ArrowLeft,
} from "lucide-react";

function Section({
  icon,
  title,
  children,
  id,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
      </div>
      <div className="prose-sm text-zinc-600 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-[#0a0a0f] p-4 font-mono text-[12px] leading-[1.8] text-zinc-400">
      {children}
    </pre>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[13px] font-mono text-zinc-700">
      {children}
    </code>
  );
}

const tocItems = [
  { label: "Installation", href: "#installation" },
  { label: "Quick Start", href: "#quick-start" },
  { label: "Schema Diff", href: "#schema-diff" },
  { label: "JSON Diff", href: "#json-diff" },
  { label: "Traffic Proxy", href: "#traffic-proxy" },
  { label: "Replay Engine", href: "#replay-engine" },
  { label: "CI/CD Integration", href: "#cicd" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <div className="h-4 w-px bg-zinc-200" />
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#18181B" />
              <path d="M7 10l7-4 7 4-7 4-7-4z" fill="#A1A1AA" />
              <path d="M7 14l7 4 7-4" stroke="#fff" strokeWidth="1.5" />
              <path d="M7 18l7 4 7-4" stroke="#71717A" strokeWidth="1.5" />
            </svg>
            <span className="text-[14px] font-semibold">
              {siteConfig.name}{" "}
              <span className="font-normal text-zinc-400">Docs</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-6 py-10 md:py-14">
        <div className="grid gap-10 md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
          <aside className="hidden md:block">
            <nav className="sticky top-24 space-y-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                On this page
              </p>
              {tocItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 space-y-12">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                Documentation
              </h1>
              <p className="mt-3 text-[15px] text-zinc-500 leading-relaxed max-w-2xl">
                Driftsurge is a CLI tool and infrastructure for catching breaking
                API changes. Compare schemas, capture traffic, and replay
                requests against staging builds.
              </p>
            </div>

            <Section id="installation" icon={<Download size={16} />} title="Installation">
              <p className="text-[14px]">
                Install the Surge CLI globally via npm:
              </p>
              <Code>{`npm install -g driftsurge`}</Code>
              <p className="text-[14px]">Or use Docker (no install required):</p>
              <Code>{`docker run equixankit/driftsurge-cli --help`}</Code>
              <p className="text-[14px]">
                Verify the installation:
              </p>
              <Code>{`surge --help`}</Code>
              <p className="text-[14px]">
                Available platforms: <InlineCode>macOS (Intel & Apple Silicon)</InlineCode>,{" "}
                <InlineCode>Linux (x64, ARM64)</InlineCode>,{" "}
                <InlineCode>Windows (x64)</InlineCode>.
              </p>
            </Section>

            <Section id="quick-start" icon={<Terminal size={16} />} title="Quick Start">
              <p className="text-[14px]">
                Compare two API schemas and detect breaking changes in under
                30 seconds:
              </p>
              <Code>{`# Compare two OpenAPI schemas
surge schema diff \\
  --old api-v1.yaml \\
  --new api-v2.yaml \\
  --fail-on-breaking

# Compare two JSON response files
surge diff --old response-v1.json --new response-v2.json

# Replay captured traffic against staging
surge replay \\
  --source traffic.json \\
  --target http://staging.example.com`}</Code>
            </Section>

            <Section id="schema-diff" icon={<Shield size={16} />} title="Schema Diff">
              <p className="text-[14px]">
                Compare two OpenAPI 3.x schema files and detect breaking changes
                like removed endpoints, type changes, and new required parameters.
              </p>
              <Code>{`surge schema diff \\
  --old api-v1.yaml \\
  --new api-v2.yaml \\
  --fail-on-breaking \\
  --format text`}</Code>
              <p className="text-[14px] font-medium text-zinc-700">Flags:</p>
              <div className="space-y-2 text-[13px]">
                <p><InlineCode>--old</InlineCode> — Path to the old/original schema file (required)</p>
                <p><InlineCode>--new</InlineCode> — Path to the new/modified schema file (required)</p>
                <p><InlineCode>--fail-on-breaking</InlineCode> — Exit with code 1 if breaking changes found</p>
                <p><InlineCode>--breaking-only</InlineCode> — Show only breaking changes</p>
                <p><InlineCode>--format</InlineCode> — Output format: <InlineCode>text</InlineCode> or <InlineCode>json</InlineCode></p>
                <p><InlineCode>--output</InlineCode> — Write output to a file</p>
              </div>
              <p className="text-[14px] font-medium text-zinc-700 mt-4">Exit codes:</p>
              <div className="space-y-1 text-[13px]">
                <p><InlineCode>0</InlineCode> — No breaking changes</p>
                <p><InlineCode>1</InlineCode> — Breaking changes detected (with <InlineCode>--fail-on-breaking</InlineCode>)</p>
                <p><InlineCode>2</InlineCode> — Error occurred</p>
              </div>
            </Section>

            <Section id="json-diff" icon={<FileJson size={16} />} title="JSON Diff">
              <p className="text-[14px]">
                Compare two JSON files and produce a detailed diff report with
                type changes, additions, and removals.
              </p>
              <Code>{`surge diff \\
  --old response-v1.json \\
  --new response-v2.json \\
  --array-as-set \\
  --format json`}</Code>
              <p className="text-[14px] font-medium text-zinc-700">Flags:</p>
              <div className="space-y-2 text-[13px]">
                <p><InlineCode>--old</InlineCode> — Path to the old JSON file (required)</p>
                <p><InlineCode>--new</InlineCode> — Path to the new JSON file (required)</p>
                <p><InlineCode>--array-as-set</InlineCode> — Compare arrays as sets (ignore order)</p>
                <p><InlineCode>--ignore</InlineCode> — JSON paths to ignore (comma-separated)</p>
                <p><InlineCode>--format</InlineCode> — Output format: <InlineCode>text</InlineCode> or <InlineCode>json</InlineCode></p>
              </div>
            </Section>

            <Section id="traffic-proxy" icon={<Server size={16} />} title="Traffic Proxy">
              <p className="text-[14px]">
                Deploy the Driftsurge proxy to capture production traffic. It
                runs as a reverse proxy, sampling request/response pairs with
                automatic PII redaction.
              </p>
              <Code>{`docker run -d \\
  -e TVC_STORAGE_POSTGRES_URL=postgresql://... \\
  -e TVC_STORAGE_REDIS_URL=rediss://... \\
  -p 8081:8080 \\
  equixankit/driftsurge-proxy`}</Code>
              <p className="text-[14px]">
                The proxy adds less than 5ms of latency at p95. It uses async
                buffering so the forwarding path is never blocked by storage I/O.
                Configure sampling rates to capture 1-100% of traffic.
              </p>
            </Section>

            <Section id="replay-engine" icon={<Play size={16} />} title="Replay Engine">
              <p className="text-[14px]">
                Replay captured traffic against a target server and compare
                every response semantically.
              </p>
              <Code>{`surge replay \\
  --source traffic.json \\
  --target http://staging.example.com \\
  --workers 20 \\
  --rate-limit 500 \\
  --format json \\
  --output drift-report.json`}</Code>
              <p className="text-[14px] font-medium text-zinc-700">Flags:</p>
              <div className="space-y-2 text-[13px]">
                <p><InlineCode>--source</InlineCode> — Traffic JSON file (required)</p>
                <p><InlineCode>--target</InlineCode> — Target server URL (required)</p>
                <p><InlineCode>--workers</InlineCode> — Concurrent workers (default: 10)</p>
                <p><InlineCode>--rate-limit</InlineCode> — Max requests per second (0 = unlimited)</p>
                <p><InlineCode>--timeout</InlineCode> — Per-request timeout (default: 30s)</p>
                <p><InlineCode>--max-retries</InlineCode> — Max retries per request (default: 2)</p>
              </div>
            </Section>

            <Section id="cicd" icon={<Terminal size={16} />} title="CI/CD Integration">
              <p className="text-[14px]">
                Add Driftsurge to your CI/CD pipeline to automatically block
                deploys with breaking changes.
              </p>
              <p className="text-[14px] font-medium text-zinc-700">GitHub Actions:</p>
              <Code>{`# .github/workflows/api-check.yml
name: API Schema Check
on: [pull_request]

jobs:
  schema-diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Surge CLI
        run: npm install -g driftsurge

      - name: Check for breaking changes
        run: |
          surge schema diff \\
            --old api/schema-main.yaml \\
            --new api/schema.yaml \\
            --fail-on-breaking`}</Code>
              <p className="text-[14px]">
                The CLI returns standard exit codes so your pipeline blocks
                automatically: <InlineCode>0</InlineCode> = clean,{" "}
                <InlineCode>1</InlineCode> = breaking changes,{" "}
                <InlineCode>2</InlineCode> = error.
              </p>
            </Section>
          </main>
        </div>
      </div>
    </div>
  );
}
