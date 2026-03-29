"use client";

import { Layers, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function AuthLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* Left Pane - Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 lg:p-12 xl:p-24 relative z-10">
        <div className="w-full max-w-sm xl:max-w-md flex flex-col gap-8">
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
          <div className="mt-8 text-center text-sm text-zinc-500">
            © 2026 Diffsurge Inc.
          </div>
        </div>
      </div>

      {/* Right Pane - Visual / Brand (Hidden on Mobile) */}
      <div className="hidden md:flex w-1/2 bg-zinc-950 relative overflow-hidden items-center justify-center text-white p-12">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="max-w-xl z-10 w-full relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-12">
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
            <p className="text-lg text-zinc-400 mb-12 leading-relaxed max-w-md">
              Automated contract testing that integrates seamlessly with your CI/CD pipeline. Ship faster, break less.
            </p>

            {/* Feature List */}
            <div className="flex flex-col gap-4">
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

            {/* Testimonial & Mock UI Grid */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-xs text-zinc-500 ml-2 font-mono">diff --api /v1/users</span>
                </div>
                <div className="font-mono text-sm space-y-1">
                  <div className="text-zinc-400">  type User = {'{'}</div>
                  <div className="text-zinc-400">    id: string;</div>
                  <div className="text-rose-400 bg-rose-500/10 px-2 rounded -mx-2 flex justify-between group">
                    <span>-   role: string;</span>
                    <span className="text-xs text-rose-500/50 opacity-0 group-hover:opacity-100 transition-opacity">breaking</span>
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 px-2 rounded -mx-2 flex justify-between group">
                    <span>+   roleId: number;</span>
                  </div>
                  <div className="text-zinc-400">  {'}'}</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm flex flex-col justify-center">
                <div className="flex text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-zinc-300 italic mb-4">
                  "Diffsurge caught a schema change that would have broken our app. It's now mandatory on all our PRs."
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80" alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Alex Chen</p>
                    <p className="text-[10px] text-zinc-500">Lead Eng, Acme</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
