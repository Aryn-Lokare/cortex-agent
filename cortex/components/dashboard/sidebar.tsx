"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Megaphone,
  BarChart3,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Brain,
  GitBranch,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: GitBranch },
  { label: "Content", href: "/dashboard/content", icon: FileText },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  userEmail: string;
  userName: string | null;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* ─── Brand Header ──────────────────────────────── */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Brain className="h-4.5 w-4.5" />
        </div>
        {!collapsed && (
          <span className="text-title text-sidebar-foreground truncate">
            Cortex
          </span>
        )}
      </div>

      {/* ─── Navigation ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-body-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  {/* Active indicator bar */}
                  <div className="relative flex items-center">
                    {isActive && (
                      <div className="absolute -left-2.5 h-4 w-[3px] rounded-full bg-sidebar-primary" />
                    )}
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70"
                      }`}
                    />
                  </div>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ─── User Profile & Sign Out ───────────────────── */}
      <div className="border-t border-border p-2">
        {!collapsed && (
          <div className="mb-2 px-2.5 py-1.5">
            <p className="text-eyebrow text-sidebar-foreground/50 uppercase tracking-wider">
              Account
            </p>
            {userName && (
              <p className="mt-1 text-body-sm font-medium text-sidebar-foreground truncate">
                {userName}
              </p>
            )}
            <p className="text-caption text-sidebar-foreground/40 truncate">
              {userEmail}
            </p>
          </div>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-body-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </form>
      </div>

      {/* ─── Collapse Toggle ───────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[18px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
