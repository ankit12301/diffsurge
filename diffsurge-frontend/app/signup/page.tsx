"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/lib/constants";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Github, MoveRight } from "lucide-react";
import { motion } from "framer-motion";
export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { org_name: orgName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
  }

  async function handleOAuth(provider: "github" | "google") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  if (success) {
    return (
      <AuthLayout>
        <motion.div className="flex flex-col items-center justify-center text-center">
          <div
            className="h-12 w-12 rounded-full border border-indigo-200 flex items-center justify-center mb-4 text-indigo-600 bg-indigo-50"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-950 mb-3">Check your email</h1>
          <p className="text-zinc-500 mb-6 max-w-sm">
            We&apos;ve sent a verification link to <strong className="text-zinc-900">{email}</strong>. Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium hover:underline"
          >
            Back to login
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full flex flex-col items-center sm:items-stretch"
      >
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 mb-2">Create your account</h2>
          <p className="text-zinc-500">Start catching API breaking changes today</p>
        </div>

        <div className="space-y-6">
          <button 
            type="button"
            onClick={() => handleOAuth("github")}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">Or sign up with email</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSignup}>
            {error && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 13,
                  background: "rgba(199, 116, 74, 0.08)",
                  color: "var(--accent-orange)",
                  border: "1px solid rgba(199, 116, 74, 0.15)",
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="orgName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700">
                Organization Name
              </label>
              <input
                type="text"
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Inc."
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700">
                Work Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm"
                required
                minLength={8}
              />
              <p className="text-xs text-zinc-500 mt-1">
                Must be at least 8 characters long.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white hover:bg-indigo-700 h-11 px-4 py-2 mt-2 shadow-sm"
            >
              {loading ? "Creating account..." : "Create account"}
              <MoveRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
