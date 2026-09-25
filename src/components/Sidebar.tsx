"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Entry } from "@/lib/types";
import {
  MONTHS,
  shortDay,
  type DayCell,
  type View,
  type VisibleMonth,
} from "@/lib/journal";
import { Flame, streakIntensity } from "./Flame";

const NAV: { view: View; label: string }[] = [
  { view: "write", label: "Write" },
  { view: "calendar", label: "Calendar" },
  { view: "search", label: "Search" },
];

export function Sidebar({
  view,
  activeId,
  recent,
  streak,
  longest,
  vm,
  cells,
  onNav,
  onNewPage,
  onOpen,
  onShiftMonth,
}: {
  view: View;
  activeId: string | null;
  recent: Entry[];
  streak: number;
  longest: number;
  vm: VisibleMonth;
  cells: DayCell[];
  onNav: (v: View) => void;
  onNewPage: () => void;
  onOpen: (id: string) => void;
  onShiftMonth: (n: number) => void;
}) {
  return (
    <aside className="hidden h-screen min-w-0 flex-col gap-5 overflow-auto border-r border-divider px-6 pb-[18px] pt-6 wide:flex">
      <div className="flex items-center justify-between">
        <span className="font-heading text-[23px] font-semibold tracking-[-0.015em]">
          Clay Journal
        </span>
        <button
          onClick={onNewPage}
          title="New page"
          aria-label="New page"
          className="flex h-8 w-8 items-center justify-center rounded border border-accent text-accent transition-colors hover:bg-accent/[.12]"
        >
          <Plus size={16} strokeWidth={1.6} />
        </button>
      </div>

      <nav className="flex gap-[18px] border-b border-divider text-[13px]">
        {NAV.map((n) => {
          const on = view === n.view;
          return (
            <button
              key={n.view}
              onClick={() => onNav(n.view)}
              aria-current={on ? "page" : undefined}
              className={
                "pb-2 " +
                (on
                  ? "-mb-px border-b border-accent text-accent-700"
                  : "text-ink/60 hover:text-ink")
              }
            >
              {n.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-end gap-3 border-b border-divider pb-[18px]">
        <Flame
          size={56}
          intensity={streakIntensity(streak)}
          className="mb-0.5 shrink-0"
        />
        <span className="font-heading text-[72px] leading-[.9] text-accent">
          {streak}
        </span>
        <div className="pb-1">
          <div className="font-heading text-lg font-semibold">day streak</div>
          <div className="text-xs text-ink/60">
            Longest: {longest} {longest === 1 ? "day" : "days"}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-heading text-[17px] font-semibold">
            {MONTHS[vm.m]} {vm.y}
          </span>
          <span className="flex gap-1 text-ink/55">
            <button
              onClick={() => onShiftMonth(-1)}
              aria-label="Previous month"
              className="flex h-[26px] w-[26px] items-center justify-center rounded hover:bg-ink/[.07]"
            >
              <ChevronLeft size={16} strokeWidth={1.6} />
            </button>
            <button
              onClick={() => onShiftMonth(1)}
              aria-label="Next month"
              className="flex h-[26px] w-[26px] items-center justify-center rounded hover:bg-ink/[.07]"
            >
              <ChevronRight size={16} strokeWidth={1.6} />
            </button>
          </span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
            <span key={i} className="pb-1.5 text-[10px] tracking-[.08em] text-ink/50">
              {w}
            </span>
          ))}
          {cells.map((c) => {
            if (c.kind === "blank") return <span key={c.id} className="h-9" />;
            if (c.isToday)
              return (
                <button
                  key={c.id}
                  onClick={() => (c.entry ? onOpen(c.entry.id) : onNewPage())}
                  aria-label={c.entry ? `Today: ${c.entry.title}` : "Write today"}
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-accent text-[13px] text-accent-700"
                >
                  {c.day}
                </button>
              );
            if (c.entry) {
              const entry = c.entry;
              return (
                <button
                  key={c.id}
                  onClick={() => onOpen(entry.id)}
                  title={entry.title}
                  className="flex h-9 flex-col items-center justify-center gap-[3px] rounded text-[13px] hover:bg-accent/10"
                >
                  {c.day}
                  <span className="h-1 w-1 rounded-full bg-accent" />
                </button>
              );
            }
            return (
              <span
                key={c.id}
                className="flex h-9 flex-col items-center justify-center gap-[3px] text-[13px] text-ink/45"
              >
                {c.day}
                <span className="h-1 w-1" />
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col border-t border-divider">
        <div className="pb-1.5 pt-3.5 text-[10px] uppercase tracking-[.1em] text-accent-700">
          Recent pages
        </div>
        {recent.length === 0 && (
          <p className="mt-1.5 text-[13px] italic text-ink/60">
            Your pages will gather here.
          </p>
        )}
        {recent.map((e) => {
          const on = view === "read" && activeId === e.id;
          return (
            <button
              key={e.id}
              onClick={() => onOpen(e.id)}
              className={
                "-mx-1.5 flex justify-between gap-3 rounded px-1.5 py-2 text-left text-[13px] " +
                (on
                  ? "bg-accent/10 text-accent-700"
                  : "border-b border-ink/[.08] hover:bg-ink/5")
              }
            >
              <span className="truncate">{e.title}</span>
              <span className={"flex-none " + (on ? "" : "text-ink/50")}>
                {shortDay(e)}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
