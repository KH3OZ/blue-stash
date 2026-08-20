@AGENTS.md

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes, plus persistent project
context for BlueStash. Both are read automatically at the start of every Claude Code
session in this repo.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## Part 1 — Behavioral Guidelines (General)

*Applies regardless of what's being built. Not BlueStash-specific — if this file is ever
reused as a template for another project, everything below the `---` in Part 2 is what
changes.*

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

> For BlueStash specifically, "verify" should always include the checklist in Part 2 §9
> (tsc, eslint, both themes, mobile width, a11y) — treat that as the concrete definition
> of "verified" for this repo.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Part 2 — Project Context: BlueStash

*Facts about this specific codebase — conventions, gotchas already learned, current
state. For *why* the product exists and full requirements, see
`BlueStash_Project_Proposal.md` in the repo root — don't duplicate that content here,
link to it. Update this part as the project evolves; if you correct Claude Code twice
about the same fact, it belongs here.*

### 5. Project Snapshot

BlueStash — a personal, single-user digital vault/memory wall for logging and reflecting
on 7 content types: Video, Reading, Gaming, Audio, Life/Moments, Events, Films. Full
requirements, schema, and phase plan live in `BlueStash_Project_Proposal.md`.

**Workflow convention:** Planning and prompt-drafting happens in a separate Claude chat.
Each build task arrives here as a fully-scoped prompt. Verify against this file's
conventions before writing code — don't re-derive decisions already made below.

### 6. Tech Stack — Exact, Not Approximate

| Layer | Choice | Note |
|---|---|---|
| Framework | Next.js App Router + React | `src/app/` — see §7 |
| Styling | Tailwind CSS **v4** (CSS-first) + Shadcn UI | **No `tailwind.config.ts`** — see §7 |
| Icons | Lucide React | — |
| Animation | `motion` package | Import from `motion/react`, **not** `framer-motion` (renamed) |
| Theme toggle | `next-themes` | `attribute="class"`, `defaultTheme="light"`, `enableSystem=false` |
| Database | Supabase (Postgres) | Chosen over MongoDB — 5 entry types share ~90% of fields, no document-flexibility need |
| ORM | Prisma | Type-safe schema/queries |
| Image storage | Supabase Storage | Bundled with DB/auth |

### 7. Repo Structure & Gotchas (learned the hard way — don't rediscover these)

- **Uses `src/` directory.** App Router lives at `src/app/`, not root `app/`.
- **Route protection lives at `src/proxy.ts`, not root `middleware.ts`.** Next.js 16
  deprecated the `middleware.ts` file convention and renamed it to `proxy.ts` (exported
  function `middleware` → `proxy`) — an old `middleware.ts` is silently ignored, not an
  error, so it fails with no warning at build or runtime. Placement matters too: Next
  computes the proxy-discovery root as the *parent of `appDir`*, which for this project
  (`src/app/`) is `src/` — so the file must live at `src/proxy.ts`, not the repo root,
  or it's silently skipped there as well. Verify with `npm run build`: a correctly
  discovered proxy prints a `ƒ Proxy (Middleware)` line in the route output; its absence
  means the file isn't being picked up, regardless of how correct its logic is.
- **Every entity-fetch Server Action must be scoped by `userId`, not just the
  list/plural ones.** Task 3 correctly scoped `getEntries` (the list action), but
  `src/app/actions/get-entry.ts` — a separate *singular* lookup that powers the
  `/wall?entry=<id>` deep-link modal — was written back in Phase 4.5, before auth
  existed, and got missed entirely because it's a different file with a similar name.
  It let any signed-in user open another user's entry via a guessed/shared URL until
  Task 5 caught it. When adding auth scoping, grep for every `prisma.entry.find*` call
  across `src/app/actions/`, not just the ones already named in the task — a single-row
  `findUnique`/`findFirst` is exactly as much a leak surface as a list query. Fixed by
  switching to `findFirst({ where: { id, userId } })` and using one identical
  not-found error for both "row doesn't exist" and "row belongs to someone else" —
  never let the response distinguish the two, or the error message itself becomes an
  oracle for enumerating other users' valid entry ids.
- **No `tailwind.config.ts` exists or should be created.** This project uses Tailwind v4's
  CSS-first config — all design tokens live in `src/app/globals.css` via shadcn's
  `@theme` / `.dark` CSS variable blocks. If you're about to create or edit a Tailwind
  config file, stop — you're in the wrong place.
- **No `app-shell.tsx` component.** Header + sidebar + main composition lives directly
  inside `src/app/layout.tsx`. Don't create or look for a separate shell component.
- **Category filtering lives in React Context**, not a URL query param —
  `src/context/category-filter-context.tsx` (`CategoryFilterProvider` +
  `useCategoryFilter()`), provided in `src/app/layout.tsx` alongside `SidebarProvider`.
  The sidebar (`src/components/layout/app-sidebar.tsx`) and the grid
  (`src/components/stash/stash-collection-container.tsx`) both read it via the hook.
- **Category source of truth:** `src/types/category.ts` — exports `Category` type,
  `CATEGORIES`, `CATEGORY_LABELS`, `CATEGORY_ICONS`, and `NavFilter` /
  `ALL_FILTER_*`. Always import from here rather than redefining category lists.
- **Prisma 7 requires a driver adapter — there is no plain `new PrismaClient()`.**
  The generator is `prisma-client` (not `prisma-client-js`), output to
  `src/generated/prisma`. Runtime code must install and pass an adapter explicitly:
  `src/lib/prisma.ts` uses `@prisma/adapter-pg` (`pg` driver) with `DATABASE_URL` (the
  Supabase transaction-mode pooler, `pgbouncer=true`). `prisma.config.ts` uses
  `DIRECT_URL` instead, for migrations only. `@prisma/client`, `@prisma/adapter-pg`, and
  `pg` are all required runtime `dependencies`, not just the `prisma` CLI devDependency —
  omitting any of them throws `Cannot find module '@prisma/client/runtime/client'`.
- **Two routes.** `/` renders only the composer hero (capture, no stash content). `/wall`
  is the Memory Wall (named after the proposal doc's term, §4.2) — Polaroid/Timeline
  views of stashed entries. Both share the header + sidebar from `src/app/layout.tsx`;
  only `children` (the page body) differs. Selecting a sidebar category from `/`
  navigates to `/wall` (via `useRouter().push`, guarded by `usePathname()` so selecting a
  category while already on `/wall` just filters in place, no redundant navigation).

**Key files (as of Phase 2 + in-progress Phase 3):**
- `src/app/layout.tsx` — full shell composition, `SidebarProvider`, cookie-based sidebar
  state read server-side (no flash)
- `src/app/page.tsx` — homepage (`/`): composer hero only, no stash content
- `src/app/wall/page.tsx` — Memory Wall (`/wall`): mounts `StashCollectionContainer`
- `src/app/globals.css` — all design tokens (light + dark), `--sidebar-*` tokens
- `src/context/category-filter-context.tsx` — `CategoryFilterProvider` +
  `useCategoryFilter()`, shared category-selection state (see §7)
- `src/lib/prisma.ts` — Prisma Client singleton (driver adapter + `DATABASE_URL`, see §7)
- `src/app/actions/get-entries.ts` — Server Action `getEntries(filter: NavFilter)`,
  queries `Entry` via Prisma, "ALL" = no `where` clause, sorted newest-first
  (`date desc`, nulls last)
- `src/components/stash/stash-collection-container.tsx` — client component: calls
  `getEntries()` with the current `useCategoryFilter()` value, re-fetches on change,
  renders a skeleton while loading, an empty state (distinguishing "no stashes yet" from
  "nothing in this category yet"), or `StashCollection`
- `prisma/seed.ts` — one-off script (`npx tsx prisma/seed.ts`), seeds 9 verification
  entries across all 7 categories if the table is empty; safe to re-run (no-ops if rows
  already exist)
- `src/components/layout/site-header.tsx` — header, includes `SidebarTrigger`
- `src/components/layout/app-sidebar.tsx` — shadcn `Sidebar`, "All" + 5 categories,
  tooltips when collapsed, collapses to icon-only rail (not full hide)
- `src/components/home/stash-composer.tsx` — homepage empty-state hero: headline
  "What's worth keeping?", rounded-3xl composer card. No category-selection UI (removed
  in an earlier session).
- `src/components/ui/sidebar.tsx` — shadcn primitive, offset to start below the 64px header
- `src/hooks/use-mobile.ts` — mobile breakpoint hook
- `src/types/view-mode.ts` — `ViewMode = "polaroid" | "timeline"` (2 modes; Editorial was
  built then removed), `DEFAULT_VIEW_MODE = "polaroid"`
- `src/components/stash/stash-collection.tsx` — owns view-mode state (local, unpersisted),
  renders the switcher + either the polaroid grid or the timeline list
- `src/components/stash/stash-card-polaroid.tsx` — default card: tilted photo, corner pin,
  tag-chip category label
- `src/components/stash/stash-timeline-row.tsx` — flat row layout (not a grid tile), used
  only in Timeline mode
- `src/components/stash/stash-view-switcher.tsx` — 2-icon toggle group (Polaroid, Timeline)

### 8. Design System — Current Tokens

**Direction:** moved away from a neon/glow "vault" aesthetic toward flat, minimal, warm
interactions (similar to Claude's own UI). **No colored blurred glow/shadow anywhere** —
this was deliberately removed from the Add Stash button, logo, and active nav pill.

**Theme:** full light/dark toggle, **defaults to light** (not OS-following).

| Token | Light (default) | Dark (toggle) |
|---|---|---|
| Background | `#FBF5EC` | `#0A0E1A` |
| Card | `#FFFFFF` | `#1A2438` |
| Border | `#E7DCCB` | `#334155` |
| Accent | `#3D6FE0` (hover `#2F5BC4`) | `#2E7CF6` (hover `#4F8CFF`) |
| Highlight accent | `#DB8A3C` | `#7DD3FC` |
| Text primary | `#2A2130` | `#F8FAFC` |
| Text muted | `#7A6C82` | `#8FA3C4` |

- Font: Inter or Geist
- Corners: `rounded-xl`
- Card motion: subtle hover-lift only (`translate-y` + soft shadow) — no glow

**⚠️ Accessibility guardrail:** any accent color used as text must use the solid-background
+ matching `-foreground` pairing (e.g. `bg-highlight` + `text-highlight-foreground`) — a
light tint of an accent color as its own text color (e.g. `bg-highlight/10` +
`text-highlight`) is **not presumed safe in this app** and must be verified with an actual
contrast calculation before use, not eyeballed. Two concrete findings so far:

- **Highlight** (`#DB8A3C` light / `#7DD3FC` dark): tint-as-text fails (~2.72:1). Fix
  exists and is verified — pair `--highlight` as the background with
  `--highlight-foreground` (`#2A2130`, both themes): ≥5.6:1 light, ≥9:1 dark, both above AA.
- **Primary** (`rgb(48,127,238)` light / `#2E7CF6` dark): tint-as-text also fails
  (~3.46:1 light, ~3.50:1 dark). Unlike highlight, **the solid-background fix does not
  save it either** — `bg-primary` + `text-primary-foreground` only reaches ~3.89:1 light /
  ~3.77:1 dark, still short of the 4.5:1 text threshold. This pairing is already used
  elsewhere in the app (Add Stash button, view-switcher active state) as UI-element
  fill/label, not as small standalone text — treat any *new* small-text-on-primary use
  as unresolved until a dedicated fix (e.g. a darker text-only primary variant) exists.
  Don't assume `bg-primary` + `text-primary-foreground` is safe by analogy to highlight.

> Note: `BlueStash_Project_Proposal.md` §7 has a stale palette table (v1.1) — the table
> above is current. The proposal doc flags this itself; this file is the source of truth
> for actual implemented tokens.

### 9. Workflow Conventions

- **Branching:** one branch per phase (e.g. `phase-3-stash-grid`), not per task.
  Commit after each task within the phase is verified. Merge to main once the whole
  phase passes.
- **Verification checklist** — run before considering any task done (this is the
  concrete version of Part 1 §4's "verify" step, for this repo specifically):
  - `tsc` clean
  - `eslint` clean
  - Both light and dark theme checked
  - Mobile responsive at 375px width
  - Keyboard nav / basic a11y (ARIA labels, focus states)
- Optional/nullable fields (cover, rating, short take, tags, external link) must always
  render cleanly when absent — no broken layout, no literal "undefined" text.

### 10. Status

- **Phase 1** (Supabase schema + Prisma models) — complete
- **Phase 2** (UI shell) — complete: header, sidebar, homepage composer, theming, verified
- **Phase 3** (StashCard + grid) — complete. Sub-tasks: 3.1 card display — grew from a
  single card component into a 2-mode view system (`StashCollection` + switcher: Polaroid
  default, Timeline; Editorial was explored then removed) → 3.2 lift category-filter
  state out of the sidebar into shared Context (`CategoryFilterProvider` /
  `useCategoryFilter()`) → 3.3 real Supabase data via a Server Action
  (`getEntries`/`get-entries.ts`), wired into the homepage through
  `StashCollectionContainer`, filtered by 3.2's shared state, with loading/empty states.
  Verification data: 9 seeded entries across all 7 categories (`prisma/seed.ts`).

For full phase list (4: entry creation, 5: Smart Capture, 6: filtering/search), see
`BlueStash_Project_Proposal.md` §8.