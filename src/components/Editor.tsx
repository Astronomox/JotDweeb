"use client";

import { MOODS, PROMPTS, countWords, moodLabel, type Entry } from "@/lib/types";
import { MoodIcon } from "./MoodIcon";

export function Editor({
  editing,
  offline,
  content,
  moodIdx,
  promptIdx,
  saving,
  error,
  onContent,
  onMood,
  onPrompt,
  onSave,
  onClear,
}: {
  editing: Entry | null;
  offline: boolean;
  content: string;
  moodIdx: number;
  promptIdx: number;
  saving: boolean;
  error: string | null;
  onContent: (v: string) => void;
  onMood: (i: number) => void;
  onPrompt: (i: number) => void;
  onSave: () => void;
  onClear: () => void;
}) {
  const words = countWords(content);
  const kicker = (editing ? new Date(editing.createdAt) : new Date()).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );
  const hint = offline
    ? "Offline · pages save to this device"
    : editing
    ? "Editing a saved page"
    : content.trim()
      ? "Draft kept on this device · ⌘↵ to save"
      : "⌘↵ to save";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3.5 border-b border-divider px-5 py-3.5 wide:px-10">
        <span className="mr-auto text-[11px] uppercase tracking-[.1em] text-accent-700">
          {kicker}
        </span>
        <div className="flex gap-0.5 text-ink/55" role="radiogroup" aria-label="Mood">
          {MOODS.map((m, i) => {
            const on = i === moodIdx;
            return (
              <button
                key={m}
                role="radio"
                aria-checked={on}
                title={moodLabel(m)}
                aria-label={moodLabel(m)}
                onClick={() => onMood(i)}
                className={
                  "flex h-[34px] w-[34px] items-center justify-center rounded-full border " +
                  (on ? "border-accent text-accent" : "border-transparent hover:text-accent")
                }
              >
                <MoodIcon mood={m} size={18} />
              </button>
            );
          })}
        </div>
        <span className="h-5 w-px bg-divider" />
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded border border-accent bg-transparent px-4 py-2 font-heading text-sm font-semibold text-accent hover:bg-accent/[.12] active:bg-accent/[.22] disabled:opacity-60"
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Save page"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-auto px-5 pt-11 wide:px-10">
        <div className="mx-auto flex w-full max-w-[660px] flex-col">
          <h1 className="mb-1.5 font-heading text-5xl font-normal leading-[1.05] tracking-[-0.015em]">
            {editing ? "Editing page" : "Today’s page"}
          </h1>
          <p className="mb-[22px] text-[15px] italic text-ink/60">
            A quiet space to think out loud.
          </p>
          <div className="mb-[26px] flex flex-wrap gap-2">
            {PROMPTS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => onPrompt(i)}
                aria-pressed={i === promptIdx}
                className={
                  "whitespace-nowrap rounded border px-3.5 py-[7px] text-[13px] " +
                  (i === promptIdx
                    ? "border-accent text-accent-700"
                    : "border-divider text-ink/70 hover:bg-ink/[.07]")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => onContent(e.target.value)}
            placeholder="Start writing..."
            aria-label="Journal entry"
            className="min-h-[340px] w-full flex-1 border-0 bg-transparent pb-10 font-body text-lg leading-[1.8] text-ink caret-accent outline-none focus-visible:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3.5 border-t border-divider px-5 py-2.5 text-xs text-ink/60 wide:px-10">
        <span>
          {words} {words === 1 ? "word" : "words"}
        </span>
        {error && <span className="text-accent-700">{error}</span>}
        <span className="ml-auto hidden sm:inline">{hint}</span>
        <button
          onClick={onClear}
          className="ml-auto rounded px-2 py-1 text-accent-700 hover:bg-accent/10 sm:ml-0"
        >
          {editing ? "Cancel" : "Clear"}
        </button>
      </div>
    </>
  );
}
