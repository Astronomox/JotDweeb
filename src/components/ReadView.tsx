"use client";

import { ChevronLeft, ChevronRight, PencilLine, Trash2 } from "lucide-react";
import { countWords, moodLabel, type Entry } from "@/lib/types";
import { readingBody } from "@/lib/journal";
import { MoodIcon } from "./MoodIcon";

export function ReadView({
  entry,
  older,
  newer,
  onEdit,
  onDelete,
  onOpen,
  error,
}: {
  entry: Entry;
  older?: Entry;
  newer?: Entry;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: (id: string) => void;
  error?: string | null;
}) {
  const words = countWords(entry.content);
  const paragraphs = readingBody(entry.content).split(/\n\s*\n/);

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-divider px-5 py-3.5 wide:px-10">
        <span className="mr-auto text-[11px] uppercase tracking-[.1em] text-accent-700">
          {new Date(entry.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        {error && <span className="text-xs text-accent-700">{error}</span>}
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded border border-divider px-3.5 py-2 font-heading text-sm font-semibold hover:bg-ink/[.07]"
        >
          <PencilLine size={14} strokeWidth={1.6} />
          Edit
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete entry"
          className="flex h-9 w-9 items-center justify-center rounded text-ink/60 hover:bg-accent/10 hover:text-accent-700"
        >
          <Trash2 size={16} strokeWidth={1.6} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-12 wide:px-10">
        <article className="mx-auto max-w-[620px]">
          <h1 className="mb-4 font-heading text-[46px] font-normal leading-[1.05] [text-wrap:balance]">
            {entry.title}
          </h1>
          <div className="mb-[26px] flex flex-wrap items-center gap-3.5 border-b border-divider pb-[22px] text-xs text-ink/60">
            <span className="flex items-center gap-1.5 text-accent-700">
              <span className="text-accent">
                <MoodIcon mood={entry.mood} size={16} />
              </span>
              {moodLabel(entry.mood)}
            </span>
            <span>{words} words</span>
            <span>{Math.max(1, Math.round(words / 200))} min read</span>
            <span className="rounded-[3px] bg-accent-100 px-2.5 py-[3px] text-[11px] text-accent-800">
              {entry.prompt || "Free write"}
            </span>
          </div>
          <div className="text-[17px] leading-[1.8] [hyphens:auto] text-justify">
            {paragraphs.map((p, i) => (
              <p key={i} className="mb-4 whitespace-pre-wrap">
                {p}
              </p>
            ))}
          </div>
        </article>
      </div>

      <div className="flex justify-between gap-5 border-t border-divider px-5 py-3 text-[13px] wide:px-10">
        {older ? (
          <button
            onClick={() => onOpen(older.id)}
            className="flex min-w-0 items-center gap-2 text-ink/70 hover:text-accent-700"
          >
            <ChevronLeft size={14} strokeWidth={1.6} className="flex-none" />
            <span className="truncate">{older.title}</span>
          </button>
        ) : (
          <span />
        )}
        {newer && (
          <button
            onClick={() => onOpen(newer.id)}
            className="flex min-w-0 items-center gap-2 text-accent-700"
          >
            <span className="truncate">{newer.title}</span>
            <ChevronRight size={14} strokeWidth={1.6} className="flex-none" />
          </button>
        )}
      </div>
    </>
  );
}
