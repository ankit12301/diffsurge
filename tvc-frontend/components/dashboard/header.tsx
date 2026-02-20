"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function DashboardHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-100 bg-white px-6">
      <div />

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100">
            <User size={14} className="text-zinc-500" />
          </div>
          <span className="hidden text-[13px] sm:inline">
            {user?.email ?? ""}
          </span>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-zinc-100 bg-white py-1 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
