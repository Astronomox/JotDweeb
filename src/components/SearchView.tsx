"use client";

import { Search } from "lucide-react";
import { MOODS, countWords, moodLabel, type Entry } from "@/lib/types";
import { MONTHS, WEEKDAYS } from "@/lib/journal";

export function SearchView({
  entries,
  query,
  moodFilter,
  onQuery,
  onMoodFilter,
  onOpen,
}: {
  entries: Entry[];
  query: string;
  moodFilter: string | null;
  onQuery: (q: string) => void;
  onMoodFilter: (m: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const active = Boolean(q || moodFilter);
  const hits = active
    ? entries.filter(
        (e) =>
          (!q || `${e.title} ${e.content}`.toLowerCase().includes(q)) &&
          (!moodFilter || e.mood === moodFilter)
      )
    : [];

  const heading = q
    ? `${hits.length} ${hits.length === 1 ? "page mentions" : "pages mention"} “${query.trim()}”`
    : moodFilter
      ? `${hits.length} ${moodLabel(moodFilter).toLowerCase()} ${hits.length === 1 ? "page" : "pages"}`
      : "Search your pages";

  const chips = [
    { key: null as string | null, label: "Any mood" },
    ...MOODS.map((m) => ({ key: m as string | null, label: moodLabel(m) })),
  ];

  return (
    <div className="min-h-0 flex-1 overflow-auto px-5 py-10 wide:px-10">
      <div className="mx-auto max-w-[680px]">
        <div className="mb-4 flex items-center gap-3 border-b border-ink pb-2.5 text-ink/55">
          <Search size={20} strokeWidth={1.6} />
          <input
            autoFocus
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search your pages"
            aria-label="Search your pages"
            className="min-w-0 flex-1 border-0 bg-transparent font-heading text-[30px] text-ink caret-accent outline-none focus-visible:outline-none"
          />
          <button
            onClick={() => {
              onQuery("");
              onMoodFilter(null);
            }}
            className="rounded px-2 py-1 text-xs text-accent-700 hover:bg-accent/10"
          >
            Clear
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-divider pb-[22px]">
          {chips.map((c) => {
            const on = moodFilter === c.key;
            return (
              <button
                key={c.label}
                aria-pressed={on}
                onClick={() => onMoodFilter(c.key === null || on ? null : c.key)}
                className={
                  "rounded-[3px] border px-3 py-[5px] text-xs " +
                  (on
                    ? "border-accent text-accent-700"
                    : "border-divider text-ink/75 hover:bg-ink/[.06]")
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <h2 className="mt-[22px] font-heading text-[28px] font-normal">{heading}</h2>
        {!active && (
          <p className="mt-2 text-sm italic text-ink/60">Type a word, or pick a mood.</p>
        )}
        {active && hits.length === 0 && (
          <p className="mt-2 text-sm italic text-ink/60">Nothing yet. Try another word.</p>
        )}

        {hits.map((e) => {
          const flat = e.content.replace(/\s+/g, " ");
          const i = q ? flat.toLowerCase().indexOf(q) : -1;
          const d = new Date(e.createdAt);
          const pre =
            i < 0 ? flat.slice(0, 160) : (i > 70 ? "…" : "") + flat.slice(Math.max(0, i - 70), i);
          const hit = i < 0 ? "" : flat.slice(i, i + q.length);
          const post =
            i < 0
              ? flat.length > 160
                ? "…"
                : ""
              : flat.slice(i + q.length, i + q.length + 70) +
                (flat.length > i + q.length + 70 ? "…" : "");
          return (
            <button
              key={e.id}
              onClick={() => onOpen(e.id)}
              className="-mx-2 grid w-[calc(100%+16px)] grid-cols-[52px_minmax(0,1fr)] gap-4 rounded border-b border-divider px-2 py-[22px] text-left hover:bg-accent/[.06]"
            >
              <div>
                <div className="font-heading text-[32px] leading-none text-accent">{d.getDate()}</div>
                <div className="text-[10px] uppercase tracking-[.1em] text-ink/55">
                  {MONTHS[d.getMonth()].slice(0, 3)}
                </div>
              </div>
              <div>
                <div className="mb-1.5 font-heading text-[22px] font-semibold leading-[1.2]">
                  {e.title}
                </div>
                <p className="mb-2.5 text-[15px] leading-[1.7] text-ink/85">
                  {pre}
                  {hit && (
                    <mark className="rounded-sm bg-accent-200 px-0.5 text-accent-900">{hit}</mark>
                  )}
                  {post}
                </p>
                <div className="text-xs text-ink/55">
                  {WEEKDAYS[d.getDay()]} · {countWords(e.content)} words · {e.prompt || "Free write"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
