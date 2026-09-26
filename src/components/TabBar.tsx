"use client";

import { BookOpen, Calendar, PencilLine, Search, type LucideIcon } from "lucide-react";
import type { View } from "@/lib/journal";

const TABS: { view: View; label: string; Icon: LucideIcon }[] = [
  { view: "write", label: "Write", Icon: PencilLine },
  { view: "pages", label: "Pages", Icon: BookOpen },
  { view: "calendar", label: "Calendar", Icon: Calendar },
  { view: "search", label: "Search", Icon: Search },
];

/** Bottom navigation for narrow screens. */
export function TabBar({ view, onNav }: { view: View; onNav: (v: View) => void }) {
  const current = view === "read" ? "pages" : view === "welcome" ? "write" : view;
  return (
    <nav className="grid grid-cols-4 border-t border-divider px-2 pb-2.5 pt-1 wide:hidden">
      {TABS.map(({ view: v, label, Icon }) => {
        const on = current === v;
        return (
          <button
            key={v}
            onClick={() => onNav(v)}
            aria-current={on ? "page" : undefined}
            className={
              "flex h-[52px] flex-col items-center justify-center gap-1 text-[11px] " +
              (on ? "text-accent-700" : "text-ink/60")
            }
          >
            <Icon size={20} strokeWidth={1.6} className={on ? "text-accent" : ""} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
