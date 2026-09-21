"use client";

import type { Entry } from "@/lib/types";
import { MoodIcon } from "./MoodIcon";

export function EntryList({
  entries,
  onDelete,
}: {
  entries: Entry[];
  onDelete: (id: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-clay bg-clay-surface p-8 text-center shadow-clay-sm">
        <p className="font-voice text-lg italic text-clay-soft">
          Your pages will gather here.
        </p>
        <p className="mt-1 text-sm text-clay-muted">
          Write your first entry to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="px-1 font-voice text-xl font-medium text-clay-heading">
        Past pages
      </h2>
      {entries.map((e) => (
        <article
          key={e.id}
          className="rise group rounded-[20px] bg-clay-surface p-5 shadow-clay-sm"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-clay-brandDeep">
              <MoodIcon mood={e.mood} size={18} />
              <span className="text-xs font-medium uppercase tracking-wide text-clay-muted">
                {new Date(e.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <button
              aria-label="Delete entry"
              onClick={() => onDelete(e.id)}
              className="rounded-[10px] bg-clay-surface px-2 py-1 text-clay-muted opacity-0 shadow-clay-sm transition group-hover:opacity-100 active:scale-90"
            >
              <TrashIcon />
            </button>
          </div>
          <h3 className="font-voice text-lg font-medium text-clay-heading">
            {e.title}
          </h3>
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap font-voice text-[15px] leading-relaxed text-clay-ink">
            {e.content}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-clay-muted">
            <span>{e.wordCount} words</span>
            {e.prompt && (
              <span className="rounded-full bg-clay-sunken px-2 py-0.5 shadow-clay-in-sm">
                {e.prompt}
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0v12a1 1 0 001 1h8a1 1 0 001-1V7" />
    </svg>
  );
}
