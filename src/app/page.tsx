"use client";

import { useEffect, useState } from "react";
import { Editor } from "@/components/Editor";
import { EntryList } from "@/components/EntryList";
import type { Entry } from "@/lib/types";

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/entries")
      .then((r) => r.json())
      .then((data: Entry[]) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/entries/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <h1 className="font-voice text-4xl font-medium text-clay-heading">
          Clay Journal
        </h1>
        <p className="mt-1 font-sans text-sm text-clay-muted">
          Warm pages for quiet thoughts.
        </p>
      </header>

      <Editor onSaved={(e) => setEntries((prev) => [e, ...prev])} />

      <div className="mt-10">
        {loading ? (
          <p className="text-center text-sm text-clay-muted">Loading pages…</p>
        ) : (
          <EntryList entries={entries} onDelete={handleDelete} />
        )}
      </div>

      <footer className="mt-12 text-center text-xs text-clay-muted">
        Built with Next.js, Prisma, and SQLite.
      </footer>
    </main>
  );
}
