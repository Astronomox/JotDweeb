import { countWords, deriveTitle, type Entry } from "./types";

// Every entry is mirrored to localStorage so pages show instantly on load and
// survive the API being unreachable. Entries written while offline carry
// `pending: true` (and a `local-` id when new) until they reach the database.
const ENTRIES_KEY = "clayjournal.entries";
export const LOCAL_PREFIX = "local-";

export const isLocalId = (id: string) => id.startsWith(LOCAL_PREFIX);

/** Stored entries, or null when this device has never stored any. */
export function loadLocalEntries(): Entry[] | null {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? (data as Entry[]) : null;
  } catch {
    return null;
  }
}

export function saveLocalEntries(entries: Entry[]): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    /* storage full or unavailable */
  }
}

/** Build an entry on this device, as the API would, marked for later sync. */
export function localEntry(
  fields: { content: string; mood: string; prompt: string | null },
  existing?: Entry | null
): Entry {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? `${LOCAL_PREFIX}${Date.now().toString(36)}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    title: deriveTitle(fields.content),
    content: fields.content,
    mood: fields.mood,
    prompt: fields.prompt,
    wordCount: countWords(fields.content),
    pending: true,
  };
}

/**
 * Push pending entries to the API. Returns, per input entry, the saved server
 * entry, the unchanged entry when it still can't be sent, or null when its
 * server copy no longer exists.
 */
export async function syncPending(pending: Entry[]): Promise<(Entry | null)[]> {
  return Promise.all(pending.map(syncOnce));
}

// One request per entry version, however many times loading runs (React
// Strict Mode mounts twice in dev), so an offline page is never created twice.
const inflight = new Map<string, Promise<Entry | null>>();

function syncOnce(e: Entry): Promise<Entry | null> {
  const key = `${e.id}@${e.updatedAt}`;
  let p = inflight.get(key);
  if (!p) {
    p = sendEntry(e);
    inflight.set(key, p);
    // Forget failed attempts so a later load can retry.
    p.then((r) => {
      if (r === e) inflight.delete(key);
    });
  }
  return p;
}

async function sendEntry(e: Entry): Promise<Entry | null> {
  const isNew = isLocalId(e.id);
  try {
    const res = await fetch(isNew ? "/api/entries" : `/api/entries/${e.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: e.content,
        mood: e.mood,
        prompt: e.prompt,
        createdAt: e.createdAt,
      }),
    });
    if (res.status === 404 && !isNew) return null;
    if (!res.ok) return e;
    return (await res.json()) as Entry;
  } catch {
    return e;
  }
}
