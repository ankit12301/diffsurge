import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <div className="h-4 w-px" style={{ background: "var(--border-subtle)" }} />
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#222" />
              <path d="M7 10l7-4 7 4-7 4-7-4z" fill="#A1A1AA" />
              <path d="M7 14l7 4 7-4" stroke="#fff" strokeWidth="1.5" />
              <path d="M7 18l7 4 7-4" stroke="#71717A" strokeWidth="1.5" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{siteConfig.name}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <CheckCircle2 size={28} style={{ color: "var(--accent-green)" }} />
        </div>
        <h1
          className="text-2xl font-medium"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Thank you!
        </h1>
        <p
          className="mt-4 text-[15px] leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          Your message has been sent successfully. We&apos;ll get back to you as
          soon as possible.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-primary">
            Back to home
          </Link>
          <Link href="/docs" className="btn-secondary">
            View Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
