"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/dashboard/summarize", label: "Summarize", icon: "✦" },
  { href: "/dashboard/history", label: "History", icon: "◷" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "◈" },
  { href: "/dashboard/admin", label: "Admin", icon: "⚙" },
];

function NavList({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <span className="text-base leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile hamburger button ─────────────────────────────────────── */}
      <button
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shadow"
      >
        <span className="text-lg leading-none">☰</span>
      </button>

      {/* ── Mobile backdrop ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-card border-r border-border/50 transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              C
            </div>
            <span className="font-semibold tracking-tight">ConvoSum</span>
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <NavList onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar (always visible on md+) ───────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border/50 flex-col h-full bg-card/50">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-border/50">
          <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            C
          </div>
          <span className="font-semibold tracking-tight text-foreground">ConvoSum</span>
        </div>
        <NavList />
      </aside>
    </>
  );
}
