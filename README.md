# Clay Journal

A full-stack journaling app in a warm clay-brown take on Claude's own look. Serif "voice" typeface for writing, sans for the chrome, soft claymorphism surfaces, and a generative SVG backdrop.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Prisma ORM with SQLite (zero external services)
- Tailwind CSS with a custom clay theme
- pnpm

## Features

- Write entries with prompt seeds (Free write, Gratitude, Reflect, Intentions)
- Live word count
- Mood tagging (cycles through five hand-drawn SVG faces)
- Entries persist to a real database via REST API
- List, read, and delete past entries
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
    page.tsx                    editor + list wiring
    globals.css
  components/
    Editor.tsx                  writing surface
    EntryList.tsx               past entries
    MoodIcon.tsx                SVG mood faces
    ClayArt.tsx                 background art
  lib/
    prisma.ts                   db client singleton
    types.ts                    shared types + helpers
prisma/
  schema.prisma                 JournalEntry model
```
