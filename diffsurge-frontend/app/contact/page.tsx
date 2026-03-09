"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants";
import { ArrowLeft, Mail, Send } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Placeholder — will be connected to Resend later
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  }

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
            <span className="text-[14px] font-semibold">{siteConfig.name}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-6 py-16 md:py-24">
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
              <Send size={24} className="text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Message sent
            </h1>
            <p className="mt-3 text-[14px] text-zinc-500 leading-relaxed">
              Thanks for reaching out. We&apos;ll get back to you as soon as
              possible.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 mb-4">
                <Mail size={20} />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">
                Get in touch
              </h1>
              <p className="mt-2 text-[14px] text-zinc-500 leading-relaxed">
                Have a question, feature request, or want to discuss enterprise
                plans? Drop us a message.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-zinc-700 mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-700 mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-zinc-700 mb-1.5"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-zinc-700 mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
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
        )}
      </div>
    </div>
  );
}
