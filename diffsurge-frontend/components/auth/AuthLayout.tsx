"use client";

import { Layers, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function AuthLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="h-screen overflow-hidden bg-white flex flex-col md:flex-row font-sans">
      {/* Left Pane - Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-8 py-10 lg:px-12 relative z-10">
        <div className="w-full max-w-sm xl:max-w-md flex flex-col gap-6">
          {/* Logo Header - Mobile only, since desktop has it on the right side */}
          <div className="flex md:hidden items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Layers className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">Diffsurge</span>
          </div>

          {/* Render the specific auth page content here */}
          {children}

          {/* Footer links or copyright */}
          <div className="text-center text-sm text-zinc-500">
            © 2026 Diffsurge Inc.
          </div>
        </div>
      </div>

      {/* Right Pane - Visual / Brand (Hidden on Mobile) */}
      <div className="hidden md:flex w-1/2 bg-zinc-950 relative overflow-hidden items-center justify-center text-white px-12 py-10">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="max-w-lg z-10 w-full relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 bg-white rounded-xl shadow-lg flex items-center justify-center">
              <Layers className="text-zinc-950 h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Diffsurge</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400">
              Catch API breaking changes before production.
            </h1>
            <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-md">
              Automated contract testing that integrates seamlessly with your CI/CD pipeline. Ship faster, break less.
            </p>

            {/* Feature List */}
            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200">Instant PR Feedback</h3>
                  <p className="text-sm text-zinc-500">Know immediately if your PR breaks downstream clients.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-200">Zero Configuration</h3>
                  <p className="text-sm text-zinc-500">Connect your repository and we automatically detect OpenAPI specs.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
