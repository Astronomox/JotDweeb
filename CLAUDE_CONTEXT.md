# Clay Journal — context for Claude

Last updated: 2026-09-30 (fireball + localStorage)

## State
- The Classical redesign from `design_handoff_clay_journal/` (direction 2a) is implemented. The handoff folder is a reference only; don't copy its HTML.
- Stack: Next.js 14 App Router, React 18, Prisma + SQLite (`prisma/dev.db`), Tailwind with Classical tokens in `tailwind.config.ts`, lucide-react.
- `page.tsx` mounts `JournalApp` client-only (`ssr: false`). `JournalApp.tsx` owns all state and view routing (`welcome | write | read | calendar | search | pages`).
- Derived data (streaks, month grid, stats) lives in `src/lib/journal.ts`. Types, moods, prompts and `deriveTitle` live in `src/lib/types.ts`.

## Intentional deviations from the handoff
- Fonts are self-hosted with `@fontsource/*` instead of `next/font/google`, so dev never waits on Google Fonts.
- `Flame.tsx` adds a WebGL streak fireball (sidebar 56px, mobile top bar 18px, calendar stats 32px). It isn't in the spec. It renders supersampled at 4× device pixels, capped at the GPU's MAX_VIEWPORT_DIMS. Each mount creates its own canvas and releases the context on unmount (`WEBGL_lose_context`) so contexts never leak. It falls back to a CSS radial gradient without WebGL.
- The Write footer hint is hidden below the `sm` breakpoint to keep the mobile footer on one line.

## Storage
- `src/lib/store.ts` mirrors every entry to localStorage (`clayjournal.entries`). On load, entries come from localStorage instantly, then refresh from `/api/entries`; the API is the source of truth.
- If the API is unreachable, saves stay on the device with `pending: true` (new pages get a `local-` id), and the editor hint says "Offline · pages save to this device". On the next successful load, pending pages are POSTed (keeping `createdAt`, which POST now accepts) or PATCHed.
- Sync is deduped per `id@updatedAt`, so React Strict Mode's double mount can't create duplicates.
- Deleting a `local-` page never calls the API. Pages deleted while offline aren't queued; the delete fails and the page is restored.

## Behaviour notes
- The new-page draft lives in localStorage (`clayjournal.draft`). It isn't overwritten while editing a saved page, and it comes back after Save or Cancel on an edit.
- Delete removes the page from the UI straight away. If the API call fails, it restores the page and shows "Could not delete. Try again" in the Read view.

## Verification
- `npx tsc --noEmit` and `next build` pass.
- Headless Chrome check (desktop 1440×900, mobile 390×844): every view, draft survives edit and reload, empty-save error, prompt seed, ⌘/Ctrl+Enter save, Esc closes dialog, delete, search highlight, no horizontal overflow, no console errors.
- `.shots/verify-store.mjs` (needs the dev server on port 3200) checks fireball canvas size, no context loss after 25 view switches, localStorage mirror, offline save, offline reload, and sync on reconnect. It cleans up its test entry.
- No ESLint config exists, so `next build` skips linting.
- Don't run two `next dev` servers in this folder: they share `.next` and corrupt each other's webpack cache (500s with "__webpack_modules__[moduleId] is not a function").
