"use client";

import dynamic from "next/dynamic";

// Client-only: the journal reads the local clock, localStorage and WebGL.
const JournalApp = dynamic(
  () => import("@/components/JournalApp").then((m) => m.JournalApp),
  { ssr: false }
);

export default function Home() {
  return <JournalApp />;
}
