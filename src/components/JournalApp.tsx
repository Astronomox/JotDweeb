"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MOODS, PROMPTS, type Entry } from "@/lib/types";
import {
  currentStreak,
  groupByDay,
  longestStreak,
  monthCells,
  monthStats,
  sortNewest,
  type View,
  type VisibleMonth,
} from "@/lib/journal";
import { Sidebar } from "./Sidebar";
import { Editor } from "./Editor";
import { ReadView } from "./ReadView";
import { CalendarView } from "./CalendarView";
import { SearchView } from "./SearchView";
import { Welcome } from "./Welcome";
import { EntryList } from "./EntryList";
import { TabBar } from "./TabBar";
import { ConfirmDialog } from "./ConfirmDialog";
import { Flame, streakIntensity } from "./Flame";
import {
  isLocalId,
  loadLocalEntries,
  localEntry,
  saveLocalEntries,
  syncPending,
} from "@/lib/store";

const DRAFT_KEY = "clayjournal.draft";

type Draft = { content: string; moodIdx: number; promptIdx: number };

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function JournalApp() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [view, setView] = useState<View>("write");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [moodIdx, setMoodIdx] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0);
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [vm, setVm] = useState<VisibleMonth>(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Load the unsaved draft and this device's copy of the entries straight
  // away, then refresh from the API and send anything written offline.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setContent(draft.content ?? "");
      setMoodIdx(draft.moodIdx ?? 0);
      setPromptIdx(draft.promptIdx ?? 0);
    }
    const hasDraft = Boolean(draft?.content?.trim());
    const local = loadLocalEntries();
    if (local) {
      setEntries(local);
      if (local.length === 0 && !hasDraft) setView("welcome");
      setLoading(false);
    }

    (async () => {
      let server: Entry[];
      try {
        const r = await fetch("/api/entries");
        if (!r.ok) throw new Error(String(r.status));
        server = await r.json();
      } catch {
        setOffline(true);
        if (!local) {
          if (!hasDraft) setView("welcome");
          setLoading(false);
        }
        return;
      }
      const pending = (local ?? []).filter((e) => e.pending);
      const synced = await syncPending(pending);
      const merged = new Map(server.map((e) => [e.id, e]));
      const renamed = new Map<string, string>();
      pending.forEach((p, i) => {
        const s = synced[i];
        if (!s) merged.delete(p.id);
        else {
          merged.set(s.id, s);
          if (s.id !== p.id) renamed.set(p.id, s.id);
        }
      });
      const list = [...merged.values()];
      setEntries(list);
      setOffline(synced.some((s) => s?.pending));
      if (renamed.size) {
        setActiveId((id) => (id && renamed.get(id)) || id);
        setEditingId((id) => (id && renamed.get(id)) || id);
      }
      if (!local) {
        if (list.length === 0 && !hasDraft) setView("welcome");
        setLoading(false);
      }
    })();
  }, []);

  // Mirror every change to this device.
  useEffect(() => {
    if (!loading) saveLocalEntries(entries);
  }, [entries, loading]);

  // Keep the draft on this device while writing a new page.
  useEffect(() => {
    if (loading || editingId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, moodIdx, promptIdx }));
    } catch {
      /* storage unavailable */
    }
  }, [content, moodIdx, promptIdx, editingId, loading]);

  const sorted = useMemo(() => sortNewest(entries), [entries]);
  const byDay = useMemo(() => groupByDay(sorted), [sorted]);
  const streak = useMemo(() => currentStreak(byDay), [byDay]);
  const longest = useMemo(() => longestStreak(byDay), [byDay]);
  const cells = useMemo(() => monthCells(vm, byDay), [vm, byDay]);
  const stats = useMemo(() => monthStats(vm, sorted), [vm, sorted]);
  const editing = editingId ? (entries.find((e) => e.id === editingId) ?? null) : null;

  // Leaving an edit brings back the new-page draft, which stays in storage
  // untouched while editing.
  const resetEditor = () => {
    const draft = loadDraft();
    setContent(draft?.content ?? "");
    setMoodIdx(draft?.moodIdx ?? 0);
    setPromptIdx(draft?.promptIdx ?? 0);
    setEditingId(null);
  };

  const go = (v: View) => {
    setError(null);
    setView(v);
  };

  const newPage = () => {
    if (editingId) resetEditor();
    setActiveId(null);
    go("write");
  };

  const nav = (v: View) => (v === "write" ? newPage() : go(v));

  const openEntry = (id: string) => {
    setActiveId(id);
    go("read");
  };

  const shiftMonth = (n: number) =>
    setVm(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const pickPrompt = (i: number) => {
    setPromptIdx(i);
    setContent((c) => (c.trim() ? c : PROMPTS[i].seed + " "));
  };

  const save = useCallback(async () => {
    if (saving) return;
    if (!content.trim()) {
      setError("Write something first");
      return;
    }
    setSaving(true);
    setError(null);
    const fields = { content, mood: MOODS[moodIdx], prompt: PROMPTS[promptIdx].label };
    const current = editingId ? entries.find((e) => e.id === editingId) : undefined;
    // A page that never reached the database is created there, not patched.
    const patch = Boolean(editingId && !isLocalId(editingId));
    try {
      let saved: Entry;
      try {
        const res = await fetch(patch ? `/api/entries/${editingId}` : "/api/entries", {
          method: patch ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, createdAt: current?.createdAt }),
        });
        if (!res.ok) throw new Error(String(res.status));
        saved = await res.json();
      } catch {
        // API unreachable: keep the page on this device and sync it later.
        saved = localEntry(fields, current);
        setOffline(true);
      }
      setEntries((prev) =>
        editingId ? prev.map((e) => (e.id === editingId ? saved : e)) : [saved, ...prev]
      );
      if (editingId) {
        resetEditor();
      } else {
        setContent("");
        setMoodIdx(0);
        setPromptIdx(0);
      }
      setActiveId(saved.id);
      setView("read");
    } catch {
      setError("Could not save. Try again");
    } finally {
      setSaving(false);
    }
  }, [saving, content, editingId, moodIdx, promptIdx, entries]);

  const startEdit = (e: Entry) => {
    setEditingId(e.id);
    setContent(e.content);
    setMoodIdx(Math.max(0, MOODS.indexOf(e.mood as (typeof MOODS)[number])));
    setPromptIdx(Math.max(0, PROMPTS.findIndex((p) => p.label === e.prompt)));
    go("write");
  };

  const clearOrCancel = () => {
    if (editing) {
      const id = editing.id;
      resetEditor();
      setActiveId(id);
      go("read");
    } else {
      setContent("");
      setError(null);
    }
  };

  const confirmDelete = async () => {
    const id = confirmId;
    if (!id) return;
    const removed = entries.find((e) => e.id === id);
    const remaining = entries.filter((e) => e.id !== id);
    setEntries(remaining);
    setConfirmId(null);
    setActiveId(null);
    go(remaining.length ? "write" : "welcome");
    if (isLocalId(id)) return; // never reached the database
    const ok = await fetch(`/api/entries/${id}`, { method: "DELETE" })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok && removed) {
      // Put it back so the list matches the database.
      setEntries((prev) => [removed, ...prev]);
      setActiveId(removed.id);
      setView("read");
      setError("Could not delete. Try again");
    }
  };

  // ⌘/Ctrl+Enter saves; Esc closes the delete dialog.
  const saveRef = useRef(save);
  saveRef.current = save;
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && viewRef.current === "write") {
        e.preventDefault();
        void saveRef.current();
      }
      if (e.key === "Escape") setConfirmId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const active = sorted.find((e) => e.id === activeId) ?? sorted[0];
  const activeIdx = active ? sorted.indexOf(active) : -1;

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="flex flex-1 items-center justify-center text-sm italic text-ink/60">
        Loading pages…
      </div>
    );
  } else if (view === "welcome") {
    body = (
      <Welcome
        onPrompt={(i) => {
          setPromptIdx(i);
          setContent(PROMPTS[i].seed + " ");
          go("write");
        }}
      />
    );
  } else if (view === "read" && active) {
    body = (
      <ReadView
        entry={active}
        older={sorted[activeIdx + 1]}
        newer={activeIdx > 0 ? sorted[activeIdx - 1] : undefined}
        onEdit={() => startEdit(active)}
        onDelete={() => setConfirmId(active.id)}
        onOpen={openEntry}
        error={error}
      />
    );
  } else if (view === "calendar") {
    body = (
      <CalendarView
        vm={vm}
        cells={cells}
        streak={streak}
        pages={stats.pages}
        words={stats.words}
        onShiftMonth={shiftMonth}
        onOpen={openEntry}
        onNewPage={newPage}
      />
    );
  } else if (view === "search") {
    body = (
      <SearchView
        entries={sorted}
        query={query}
        moodFilter={moodFilter}
        onQuery={setQuery}
        onMoodFilter={setMoodFilter}
        onOpen={openEntry}
      />
    );
  } else if (view === "pages") {
    body = <EntryList entries={sorted} onOpen={openEntry} />;
  } else {
    body = (
      <Editor
        editing={editing}
        offline={offline}
        content={content}
        moodIdx={moodIdx}
        promptIdx={promptIdx}
        saving={saving}
        error={error}
        onContent={(v) => {
          setContent(v);
          if (error) setError(null);
        }}
        onMood={setMoodIdx}
        onPrompt={pickPrompt}
        onSave={save}
        onClear={clearOrCancel}
      />
    );
  }

  const confirmEntry = confirmId ? entries.find((e) => e.id === confirmId) : undefined;

  return (
    <div className="grid h-screen grid-cols-[minmax(0,1fr)] overflow-hidden bg-paper wide:grid-cols-[320px_minmax(0,1fr)]">
      <Sidebar
        view={view}
        activeId={activeId}
        recent={sorted.slice(0, 6)}
        streak={streak}
        longest={longest}
        vm={vm}
        cells={cells}
        onNav={nav}
        onNewPage={newPage}
        onOpen={openEntry}
        onShiftMonth={shiftMonth}
      />
      <main className="flex h-screen min-h-0 min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-divider px-5 py-3.5 wide:hidden">
          <span className="font-heading text-[21px] font-semibold">Clay Journal</span>
          <span className="flex items-center gap-1.5 text-xs text-accent-700">
            <Flame size={18} intensity={streakIntensity(streak)} />
            {streak}-day streak
          </span>
        </div>
        {body}
        <TabBar view={view} onNav={nav} />
      </main>
      {confirmEntry && (
        <ConfirmDialog
          title={confirmEntry.title}
          onCancel={() => setConfirmId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
