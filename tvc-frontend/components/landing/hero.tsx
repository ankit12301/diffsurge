"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const demoLines = [
  { text: "$ npm install -g driftsurge", delay: 40, pause: 600 },
  { text: "", delay: 0, pause: 100, output: true },
  { text: "added 1 package in 2.1s", delay: 0, pause: 400, output: true, dim: true },
  { text: "", delay: 0, pause: 200, output: true },
  { text: "$ surge schema diff --old api-v1.yaml --new api-v2.yaml", delay: 30, pause: 800 },
  { text: "", delay: 0, pause: 100, output: true },
  { text: "Comparing 47 endpoints…", delay: 0, pause: 600, output: true, dim: true },
  { text: "", delay: 0, pause: 300, output: true },
  { text: "✗ BREAKING  POST /api/users", delay: 0, pause: 200, output: true, color: "text-red-400" },
  { text: "  └─ Required field removed: \"email_verified\"", delay: 0, pause: 200, output: true, dim: true },
  { text: "⚠ WARNING   GET /api/users/:id", delay: 0, pause: 200, output: true, color: "text-amber-400" },
  { text: "  └─ Type changed: \"age\" string → number", delay: 0, pause: 200, output: true, dim: true },
  { text: "✓ SAFE      45 endpoints unchanged", delay: 0, pause: 200, output: true, color: "text-emerald-400" },
  { text: "", delay: 0, pause: 200, output: true },
  { text: "1 breaking · 1 warning — exit code 1", delay: 0, pause: 1200, output: true, dim: true },
  { text: "", delay: 0, pause: 100, output: true },
  { text: "$ surge replay --source traffic.json --target http://staging:8080", delay: 30, pause: 800 },
  { text: "", delay: 0, pause: 100, output: true },
  { text: "Replaying 1,247 requests…", delay: 0, pause: 600, output: true, dim: true },
  { text: "", delay: 0, pause: 400, output: true },
  { text: "✓ 1,241 responses matched (99.5%)", delay: 0, pause: 200, output: true, color: "text-emerald-400" },
  { text: "⚠ 4 warnings  (type coercion)", delay: 0, pause: 200, output: true, color: "text-amber-400" },
  { text: "✗ 2 breaking  (missing fields)", delay: 0, pause: 200, output: true, color: "text-red-400" },
  { text: "▸ Report saved to drift-report.json", delay: 0, pause: 2000, output: true, color: "text-teal-400" },
];

function AnimatedTerminal() {
  const [lines, setLines] = useState<{ text: string; color?: string; dim?: boolean }[]>([]);
  const [currentTyping, setCurrentTyping] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const animating = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function sleep(ms: number) {
      return new Promise((r) => setTimeout(r, ms));
    }

    async function typeChar(text: string, delay: number) {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        setCurrentTyping(text.slice(0, i));
        await sleep(delay);
      }
    }

    async function run() {
      while (animating.current && !cancelled) {
        setLines([]);
        setCurrentTyping("");

        for (const line of demoLines) {
          if (cancelled) return;

          if (line.output) {
            setCurrentTyping("");
            setLines((prev) => [...prev, { text: line.text, color: line.color, dim: line.dim }]);
            await sleep(line.pause);
          } else {
            await typeChar(line.text, line.delay);
            await sleep(line.pause);
            setLines((prev) => [...prev, { text: line.text }]);
            setCurrentTyping("");
          }
        }

        await sleep(2000);
      }
    }

    run();

    const cursorInterval = setInterval(() => setShowCursor((v) => !v), 530);

    return () => {
      cancelled = true;
      clearInterval(cursorInterval);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines, currentTyping]);

  return (
    <div className="relative animate-float">
      <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl animate-pulse-soft" />
      <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-indigo-400/10 blur-3xl animate-pulse-soft" />

      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
            <div className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
            <div className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-zinc-400">
            ~/project
          </span>
        </div>

        <div
          ref={terminalRef}
          className="bg-[#0a0a0f] p-5 font-mono text-[12px] leading-[1.8] h-[320px] overflow-y-auto scrollbar-hide"
        >
          {lines.map((line, i) => (
            <p key={i} className={line.color || (line.dim ? "text-zinc-600" : "text-zinc-400")}>
              {line.text || "\u00A0"}
            </p>
          ))}
          {currentTyping !== undefined && (
            <p className="text-zinc-400">
              {currentTyping}
              <span className={`${showCursor ? "opacity-100" : "opacity-0"} text-teal-400 transition-opacity`}>
                █
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  return (
    <section className="relative overflow-hidden bg-white pt-14">
      <div className="hero-mesh absolute inset-0 pointer-events-none" />
      <div className="bg-grid-pattern absolute inset-0 pointer-events-none" />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-6 pt-24 pb-20 md:grid-cols-2 md:gap-16 md:pt-12 md:pb-28">
        <div>
          <FadeIn delay={0}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <Sparkles size={12} className="text-teal-500" />
              <span className="text-[12px] font-medium text-zinc-500">
                Introducing Driftsurge
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Catch{" "}
              <span className="text-gradient-animated">
                breaking API changes
              </span>{" "}
              before your users do
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-5 max-w-lg text-[15px] leading-[1.7] text-zinc-500">
              Driftsurge captures production traffic, replays it against your
              staging builds, and surfaces every breaking change, type mismatch,
              and missing field — so you ship with confidence instead of
              crossing your fingers.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                <Button
                  size="lg"
                  className="btn-gradient border-0 text-white px-7"
                >
                  Start for free
                  <ArrowRight size={15} />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="secondary" size="lg">
                  Read the docs
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-zinc-400">
              Free forever for schema diffing · No credit card required
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2} direction="right">
          <AnimatedTerminal />
        </FadeIn>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}
