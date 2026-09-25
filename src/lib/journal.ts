import { countWords, type Entry } from "./types";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export type View = "welcome" | "write" | "read" | "calendar" | "search" | "pages";
export type VisibleMonth = { y: number; m: number };

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export const shortDay = (e: Entry) => {
  const d = new Date(e.createdAt);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
};

export function sortNewest(entries: Entry[]): Entry[] {
  return [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Entries grouped by calendar day, newest first within each day. */
export function groupByDay(sorted: Entry[]): Map<string, Entry[]> {
  const map = new Map<string, Entry[]>();
  for (const e of sorted) {
    const k = dayKey(new Date(e.createdAt));
    const list = map.get(k);
    if (list) list.push(e);
    else map.set(k, [e]);
  }
  return map;
}

/** Consecutive days with an entry, ending today (or yesterday if today is blank). */
export function currentStreak(byDay: Map<string, Entry[]>, now = new Date()): number {
  const d = new Date(now);
  if (!byDay.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (byDay.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function longestStreak(byDay: Map<string, Entry[]>): number {
  const days = [...byDay.keys()]
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m - 1, d).getTime();
    })
    .sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const t of days) {
    run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  return longest;
}

export type DayCell =
  | { kind: "blank"; id: string }
  | { kind: "day"; id: string; day: number; isToday: boolean; entry?: Entry };

/** Month grid cells, Monday first, padded to whole weeks. */
export function monthCells(
  { y, m }: VisibleMonth,
  byDay: Map<string, Entry[]>,
  now = new Date()
): DayCell[] {
  const cells: DayCell[] = [];
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) cells.push({ kind: "blank", id: `b${i}` });
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = dayKey(now);
  for (let d = 1; d <= daysInMonth; d++) {
    const k = dayKey(new Date(y, m, d));
    cells.push({
      kind: "day",
      id: k,
      day: d,
      isToday: k === todayKey,
      entry: byDay.get(k)?.[0],
    });
  }
  while (cells.length % 7) cells.push({ kind: "blank", id: `a${cells.length}` });
  return cells;
}

export function monthStats({ y, m }: VisibleMonth, sorted: Entry[]) {
  let pages = 0;
  let words = 0;
  for (const e of sorted) {
    const d = new Date(e.createdAt);
    if (d.getFullYear() === y && d.getMonth() === m) {
      pages++;
      words += countWords(e.content);
    }
  }
  return { pages, words };
}

/** Body text without the first line when that line was used as the title. */
export function readingBody(content: string): string {
  const lines = content.trim().split("\n");
  return lines.length > 1 && lines[0].trim().length <= 60
    ? lines.slice(1).join("\n").trim()
    : content.trim();
}
