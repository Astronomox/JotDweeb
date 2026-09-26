"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { MONTHS, type DayCell, type VisibleMonth } from "@/lib/journal";
import { Flame, streakIntensity } from "./Flame";
import { MoodIcon } from "./MoodIcon";

export function CalendarView({
  vm,
  cells,
  streak,
  pages,
  words,
  onShiftMonth,
  onOpen,
  onNewPage,
}: {
  vm: VisibleMonth;
  cells: DayCell[];
  streak: number;
  pages: number;
  words: number;
  onShiftMonth: (n: number) => void;
  onOpen: (id: string) => void;
  onNewPage: () => void;
}) {
  const stats = [
    { value: String(streak), label: "day streak", flame: true },
    { value: String(pages), label: pages === 1 ? "page" : "pages" },
    { value: words.toLocaleString("en-US"), label: "words" },
  ];
  const cellBorder = "border-b border-r border-divider";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 pb-7 pt-8 wide:px-10">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-7 border-b border-divider pb-[22px]">
        <div className="mr-auto">
          <div className="mb-1 text-[11px] uppercase tracking-[.1em] text-accent-700">
            Calendar
          </div>
          <h1 className="font-heading text-[44px] font-normal leading-none">
            {MONTHS[vm.m]} {vm.y}
          </h1>
        </div>
        {stats.map((s) => (
          <div key={s.label} className="flex items-end gap-1.5">
            {s.flame && (
              <Flame size={32} intensity={streakIntensity(streak)} />
            )}
            <div>
              <div className="font-heading text-4xl leading-none text-accent">{s.value}</div>
              <div className="text-xs text-ink/60">{s.label}</div>
            </div>
          </div>
        ))}
        <div className="flex gap-1">
          <button
            onClick={() => onShiftMonth(-1)}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded border border-divider hover:bg-ink/[.07]"
          >
            <ChevronLeft size={16} strokeWidth={1.6} />
          </button>
          <button
            onClick={() => onShiftMonth(1)}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded border border-divider hover:bg-ink/[.07]"
          >
            <ChevronRight size={16} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="mt-[18px] grid grid-cols-7 text-[10px] uppercase tracking-[.1em] text-ink/55">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
          <span key={w} className="px-2 pb-2">
            {w}
          </span>
        ))}
      </div>
      <div className="grid min-h-[420px] flex-1 auto-rows-fr grid-cols-7 border-l border-t border-divider">
        {cells.map((c) => {
          if (c.kind === "blank") return <div key={c.id} className={cellBorder} />;
          if (c.isToday)
            return (
              <button
                key={c.id}
                onClick={() => (c.entry ? onOpen(c.entry.id) : onNewPage())}
                className={`${cellBorder} flex min-w-0 flex-col gap-1 p-2 text-left shadow-[inset_0_0_0_1px_#b68235]`}
              >
                <span className="font-heading text-lg font-semibold text-accent-700">{c.day}</span>
                <span className="truncate text-[11px] text-accent-700">
                  {c.entry ? c.entry.title : "Write today"}
                </span>
              </button>
            );
          if (c.entry) {
            const entry = c.entry;
            return (
              <button
                key={c.id}
                onClick={() => onOpen(entry.id)}
                className={`${cellBorder} flex min-w-0 flex-col gap-1 p-2 text-left hover:bg-accent/[.08]`}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="font-heading text-lg">{c.day}</span>
                  <span className="text-accent">
                    <MoodIcon mood={entry.mood} size={15} />
                  </span>
                </span>
                <span className="line-clamp-2 text-[11px] leading-[1.35] text-ink/70">
                  {entry.title}
                </span>
              </button>
            );
          }
          return (
            <div key={c.id} className={`${cellBorder} p-2`}>
              <span className="font-heading text-lg text-ink/40">{c.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
