# Clay Journal

A full-stack journaling app in the Classical style: Cormorant Garamond headings over Lora body text, hairline rules, and a single gold accent. A calendar-led sidebar sits beside a wide writing surface; narrow screens get a bottom tab bar.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Prisma ORM with SQLite (zero external services)
- Tailwind CSS with the Classical design tokens
- lucide-react icons, self-hosted fonts via @fontsource
- pnpm

## Features

- Write entries with prompt seeds (Free write, Gratitude, Reflect, Intentions)
- Live word count
- Mood tagging with five hand-drawn SVG faces
- Entries persist to a real database via REST API
- Read view with older/newer navigation, edit, and delete with confirmation
- Calendar with streak, monthly page and word counts
- Search by word and mood, with highlighted matches
- Draft kept on the device across reloads; ⌘/Ctrl+Enter saves
- Entries mirrored to localStorage: instant load, offline saves that sync when the API is back
- Live WebGL fireball that grows with your streak
- Auto-derived titles from the first line

## Getting started

Requires Node 18+ and pnpm.

```bash
pnpm install

# generate the client and create the SQLite database
pnpm setup

# run the dev server
pnpm dev
```

Open http://localhost:3000

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm setup` | Generate Prisma client and run the initial migration |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build (runs prisma generate first) |
| `pnpm start` | Serve the production build |
| `pnpm db:studio` | Open Prisma Studio to inspect the database |
| `pnpm db:reset` | Wipe and recreate the database |

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/entries` | List all entries, newest first |
| `POST` | `/api/entries` | Create an entry `{ content, mood?, prompt? }` |
| `GET` | `/api/entries/:id` | Fetch one entry |
| `PATCH` | `/api/entries/:id` | Update content, mood, or prompt |
| `DELETE` | `/api/entries/:id` | Delete an entry |

## Project layout

```
src/
  app/
    api/entries/route.ts        list + create
    api/entries/[id]/route.ts   get + update + delete
    layout.tsx                  fonts + root shell
    page.tsx                    mounts JournalApp (client only)
    globals.css
  components/
    JournalApp.tsx              state, data loading, view routing
    Sidebar.tsx                 brand, nav, streak, mini calendar, recent pages
    TabBar.tsx                  bottom tabs on narrow screens
    Editor.tsx                  Write view
    ReadView.tsx                Read view
    CalendarView.tsx            month grid + stats
    SearchView.tsx              word + mood search
    EntryList.tsx               Pages tab (narrow screens)
    Welcome.tsx                 empty state with prompt cards
    ConfirmDialog.tsx           delete confirmation
    Flame.tsx                   WebGL streak fireball
    MoodIcon.tsx                SVG mood faces
  lib/
    prisma.ts                   db client singleton
    types.ts                    shared types + helpers
    journal.ts                  calendar, streak and grouping helpers
    store.ts                    localStorage mirror + offline sync
prisma/
  schema.prisma                 JournalEntry model
```
