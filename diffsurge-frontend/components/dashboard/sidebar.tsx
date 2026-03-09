"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";
import { useProject } from "@/lib/providers/project-provider";
import {
  LayoutDashboard,
  Radio,
  RefreshCw,
  FileCode2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Check,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/traffic", label: "Traffic", icon: Radio },
  { href: "/replay", label: "Replay", icon: RefreshCw },
  { href: "/schemas", label: "Schemas", icon: FileCode2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const { projects, activeProject, setActiveProject } = useProject();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-zinc-100 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#18181B" />
              <path d="M7 10l7-4 7 4-7 4-7-4z" fill="#A1A1AA" />
              <path d="M7 14l7 4 7-4" stroke="#fff" strokeWidth="1.5" />
              <path d="M7 18l7 4 7-4" stroke="#71717A" strokeWidth="1.5" />
            </svg>
            <span className="text-[14px] font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && !collapsed && (
        <div className="relative border-b border-zinc-100 p-2">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-zinc-50"
          >
            <FolderOpen size={14} className="shrink-0 text-zinc-400" />
            <span className="flex-1 truncate font-medium text-zinc-700">
              {activeProject?.name || "Select project"}
            </span>
            {projects.length > 1 && (
              <ChevronDown
                size={14}
                className={cn(
                  "shrink-0 text-zinc-400 transition-transform",
                  projectDropdownOpen && "rotate-180"
                )}
              />
            )}
          </button>

          {projectDropdownOpen && projects.length > 1 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProjectDropdownOpen(false)}
              />
              <div className="absolute left-2 right-2 top-full z-50 mt-1 rounded-lg border border-zinc-100 bg-white py-1 shadow-lg">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setActiveProject(project);
                      setProjectDropdownOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-zinc-50",
                      activeProject?.id === project.id && "bg-zinc-50"
                    )}
                  >
                    <span className="flex-1 truncate text-zinc-700">
                      {project.name}
                    </span>
                    {activeProject?.id === project.id && (
                      <Check size={14} className="shrink-0 text-zinc-500" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Collapsed project indicator */}
      {projects.length > 0 && collapsed && activeProject && (
        <div className="border-b border-zinc-100 p-2">
          <div
            className="flex items-center justify-center rounded-lg p-2 text-zinc-400"
            title={activeProject.name}
          >
            <FolderOpen size={18} />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} strokeWidth={1.75} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-100 p-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200/60 p-3",
            collapsed && "justify-center p-2"
          )}
        >
          <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Beta
          </span>
          {!collapsed && (
            <p className="text-[11px] font-medium text-amber-700">
              Early access preview
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
