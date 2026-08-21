# BlueStash

A personal digital vault and memory wall. Log, browse, and reflect on anything you consume or experience, videos, books, games, podcasts, and everyday life moments, in one visually cohesive, searchable space.

**Live:** [bluestash.app](https://bluestash.app)

> Status: Beta. Core logging, browsing, and auth are live. See [Roadmap](#roadmap) for what's still in progress.

---

## Why this exists

Reflection on something you watched, read, played, or experienced is valuable but fragile. Without a fast, low-friction place to capture it, the thought disappears within days. BlueStash gives that reflection one home, and makes revisiting it something you actually want to do.

---

## Features

- **5 entry types:** Video, Reading, Gaming, Audio, and Life/Moments in one unified logging flow.
- **Memory wall:** a responsive grid of past entries, with cover image, rating, short take, date, and tags at a glance.
- **Quick capture or deep reflection:** log a short take in seconds, or come back later and write a full Markdown reflection. Neither is forced.
- **Search, filter, and sort:** real-time search across title, tags, and text. Filter by category. Sort by date or rating.
- **Full CRUD:** create, edit, and delete any entry, with a confirmation step before anything is lost.
- **Cross-device sync:** your data follows you, backed by a cloud database, not stuck on one device.
- **Google sign-in:** single-user auth, private by default. No public entry access.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + React | SSR-capable, strong ecosystem fit for the rest of the stack |
| Styling | Tailwind CSS + shadcn/ui | Accessible defaults, fast to build and stay consistent |
| Icons | Lucide React | Lightweight, consistent icon set |
| Animation | Motion (`motion/react`) | Smooth grid loading and modal transitions |
| Database | Supabase (Postgres) | Cross-device sync, bundled auth and storage |
| ORM | Prisma | Type-safe schema and queries |
| Auth | Supabase Auth (Google OAuth) | Single-user, private by default |
| Storage | Supabase Storage | Bundled with the database, one dashboard |
| Hosting | Vercel | Native fit for Next.js, auto-deploys on push to `main` |
| Domain | bluestash.app | Custom domain via name.com |

---

## Getting started (local development)

### Prerequisites
- Node.js (LTS)
- A Supabase project (free tier is enough for development)
- `npm`

### Setup

```bash
git clone https://github.com/KH3OZ/blue-stash.git
cd blue-stash
npm install
```

Create a `.env` file in the project root with the following variables. Never commit this file.

```
DATABASE_URL=            # Supabase pooled connection string (port 6543)
DIRECT_URL=               # Supabase direct connection string (port 5432), used for migrations
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run migrations and start the dev server:

```bash
npx prisma migrate deploy
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Deployment

BlueStash deploys automatically. Every push to `main` triggers a Vercel build and deploy straight to [bluestash.app](https://bluestash.app). Pushes to other branches or open pull requests build a preview only, never the live site.

A few things that matter in production and are easy to miss:
- `prisma generate` runs on `postinstall`, since the Prisma Client uses a custom output path and won't exist otherwise.
- `DATABASE_URL` must use Supabase's pooled connection (port `6543`) in production, not the direct connection, to avoid exhausting connections on serverless.
- Supabase's **Site URL** and **Redirect URLs** (under Authentication → URL Configuration) must include the production domain, or Google sign-in will redirect back to `localhost`.

---

## Roadmap

- **Smart Capture:** type a plain-language description (e.g. "Today I watched The Odyssey, one of the best movies I've seen") and have title, category, and date extracted automatically, with a confirm-before-save step. Video-only to start, verified against TMDB.
- Metadata providers for Reading, Gaming, and Audio (manual entry only for now).
- Scale testing and virtualization past ~1,000 entries.

---

## Non-goals (for now)

- Multi-user or social features (sharing, following, public profiles).
- Native mobile app (responsive web only).
- Offline-first or local-only mode.

---

## License
[![License: MIT](https://shields.io)](https://opensource.org)
