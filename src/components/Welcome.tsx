"use client";

import { PROMPTS } from "@/lib/types";

export function Welcome({ onPrompt }: { onPrompt: (i: number) => void }) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-auto px-5 py-10 wide:px-10">
      <div className="max-w-[620px] text-center">
        <h1 className="mb-2.5 font-heading text-[52px] font-normal leading-[1.05]">
          Your pages will gather here.
        </h1>
        <p className="mb-9 text-base italic text-ink/60">Write your first entry to begin.</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 text-left">
          {PROMPTS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => onPrompt(i)}
              className="rounded border border-divider px-[18px] py-4 text-left hover:border-accent hover:bg-accent/[.06]"
            >
              <div className="mb-1.5 text-[10px] uppercase tracking-[.1em] text-accent-700">
                {p.label}
              </div>
              <div className="font-heading text-[19px] italic leading-[1.3]">
                &ldquo;{p.seed}&hellip;&rdquo;
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
