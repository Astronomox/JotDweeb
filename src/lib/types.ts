export type Entry = {
  id: string;
  title: string;
  content: string;
  mood: string;
  prompt: string | null;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
};

export const MOODS = ["smile", "happy", "neutral", "sad", "heart"] as const;
export type Mood = (typeof MOODS)[number];

export const PROMPTS = [
  { label: "Free write", seed: "What's on my mind right now is" },
  { label: "Gratitude", seed: "Three things I'm grateful for today:" },
  { label: "Reflect", seed: "Something I learned today was" },
  { label: "Intentions", seed: "Tomorrow, I want to" },
] as const;

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function deriveTitle(content: string): string {
  const first = content.trim().split(/\n/)[0]?.trim() ?? "";
  if (!first) return "Untitled";
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}
