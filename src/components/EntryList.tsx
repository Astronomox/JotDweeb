"use client";

import type { Entry } from "@/lib/types";
import { WEEKDAYS } from "@/lib/journal";
import { MoodIcon } from "./MoodIcon";

/** Full list of pages, used by the Pages tab on narrow screens. */
export function EntryList({
  entries,
  onOpen,
}: {
  entries: Entry[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto px-5 py-5 wide:px-10">
      <h1 className="mb-3 font-heading text-4xl font-normal leading-none">Pages</h1>
      {entries.length === 0 && (
        <p className="text-sm italic text-ink/60">Your pages will gather here.</p>
      )}
      {entries.map((e) => {
        const d = new Date(e.createdAt);
        const excerpt = e.content.split("\n").slice(1).join(" ").trim() || e.content;
        return (
          <button
            key={e.id}
            onClick={() => onOpen(e.id)}
            className="grid w-full grid-cols-[36px_minmax(0,1fr)_18px] gap-3 border-b border-ink/10 py-3.5 text-left"
          >
            <div className="text-center">
              <div className="font-heading text-[26px] leading-none">{d.getDate()}</div>
              <div className="text-[9px] uppercase tracking-[.1em] text-ink/55">
                {WEEKDAYS[d.getDay()]}
              </div>
            </div>
            <div className="min-w-0">
              <div className="truncate font-heading text-[17px] font-semibold leading-[1.2]">
                {e.title}
              </div>
              <div className="line-clamp-2 text-[13px] leading-normal text-ink/60">{excerpt}</div>
            </div>
            <span className="text-accent">
              <MoodIcon mood={e.mood} size={18} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
