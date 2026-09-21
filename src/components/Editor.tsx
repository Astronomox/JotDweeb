"use client";

import { useState } from "react";
import { MOODS, PROMPTS, countWords, type Entry } from "@/lib/types";
import { MoodIcon } from "./MoodIcon";
import { ClayArt } from "./ClayArt";

export function Editor({ onSaved }: { onSaved: (e: Entry) => void }) {
  const [content, setContent] = useState("");
  const [moodIdx, setMoodIdx] = useState(0);
  const [activePrompt, setActivePrompt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = countWords(content);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function pickPrompt(i: number) {
    setActivePrompt(i);
    if (!content.trim()) setContent(PROMPTS[i].seed + " ");
  }

  async function save() {
    if (!content.trim()) {
      setError("Write something first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mood: MOODS[moodIdx],
          prompt: PROMPTS[activePrompt].label,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const entry: Entry = await res.json();
      onSaved(entry);
      setContent("");
      setActivePrompt(0);
    } catch {
      setError("Could not save. Try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-clay bg-clay-surface p-6 shadow-clay">
      <ClayArt />
      <div className="relative z-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-clay-brand text-white shadow-clay-sm">
            <SparkIcon />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-clay-muted">
            {today}
          </span>
          <button
            aria-label="Cycle mood"
            onClick={() => setMoodIdx((moodIdx + 1) % MOODS.length)}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-clay-surface text-clay-brandDeep shadow-clay-sm transition active:scale-90 active:shadow-clay-in-sm"
          >
            <MoodIcon mood={MOODS[moodIdx]} />
          </button>
        </div>

        <h1 className="px-0.5 font-voice text-3xl font-medium text-clay-heading">
          Today&apos;s page
        </h1>
        <p className="mb-4 px-0.5 font-voice text-[15px] italic text-clay-soft">
          A quiet space to think out loud.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {PROMPTS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => pickPrompt(i)}
              className={
                "rounded-[14px] px-3 py-1.5 text-xs font-medium transition active:scale-95 " +
                (i === activePrompt
                  ? "bg-clay-accent text-white shadow-clay-in-sm"
                  : "bg-clay-surface text-clay-soft shadow-clay-sm")
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mb-3 rounded-[20px] bg-clay-sunken p-4 shadow-clay-in">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Start writing..."
            className="clay-scroll h-40 w-full bg-transparent font-voice text-base leading-relaxed text-clay-ink outline-none placeholder:italic placeholder:text-clay-muted/70"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-clay-muted">
            {words} {words === 1 ? "word" : "words"}
            {error && <span className="ml-3 text-clay-brandDeep">{error}</span>}
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setContent("");
                setError(null);
              }}
              className="rounded-[18px] bg-clay-surface px-4 py-2.5 text-[13px] font-medium text-clay-heading shadow-clay-sm transition active:scale-95 active:shadow-clay-in-sm"
            >
              Clear
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-[18px] bg-clay-brand px-4 py-2.5 text-[13px] font-medium text-[#FFF3EA] shadow-brand transition active:scale-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c.4 3.8 2.2 5.6 6 6-3.8.4-5.6 2.2-6 6-.4-3.8-2.2-5.6-6-6 3.8-.4 5.6-2.2 6-6z" />
    </svg>
  );
}
