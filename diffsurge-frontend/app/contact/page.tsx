"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong.");
      }
      router.push("/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      setLoading(false);
    }
  }

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

      <div className="mx-auto max-w-lg px-6 py-16 md:py-24">
          <>
            <div className="mb-8">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg mb-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                <Mail size={20} style={{ color: "var(--text-muted)" }} />
              </div>
              <h1 className="text-2xl font-medium" style={{ color: "var(--text-primary)" }}>
                Get in touch
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Have a question, feature request, or want to discuss enterprise
                plans? Drop us a message or email us directly at{" "}
                <a href="mailto:ankit@diffsurge.com" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>ankit@diffsurge.com</a>.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--accent-red)", color: "var(--accent-red)", background: "rgba(239,68,68,0.05)" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-1 resize-none"
                  style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  placeholder="Tell us more..."
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg"
              >
                {loading ? "Sending..." : "Send message"}
              </Button>
            </form>
          </>
      </div>
    </div>
  );
}
