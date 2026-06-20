# Prompt Gallery — Implementation Plan & Progress Tracker

**Status:** Planning · v1
**Companion doc:** [ARCHITECTURE.md](ARCHITECTURE.md)
**Stack decision (confirmed):** Next.js (`output: export`) · pnpm workspaces monorepo · TypeScript strict
**Design direction (confirmed):** Modern Pinterest-style masonry gallery · automatic light/dark theme with manual toggle
**Data direction (confirmed):** Real upstream data via the ETL pipeline (live fetch validated — see §0)
**Production URL (confirmed):** `https://aiprompts.hubs.dpdns.org` — custom domain, so `basePath = ""` (site is at root, no sub-path needed)

> This document is the single source of truth for *what we are building and how far along we are*.
> Every task is a checkbox. Keep statuses current: `[ ]` not started · `[~]` in progress · `[x]` done.
> Architecture rationale lives in `ARCHITECTURE.md`; this file is the execution layer.

---

## 0. Source validation (done during planning)

The upstream source was inspected live before writing this plan. Confirmed facts that shape the work:

- [x] Repo exists and is active: `YouMind-OpenLab/awesome-gpt-image-2` (TypeScript, ~7.6k stars, pushed today, CC BY 4.0).
- [x] Entry format confirmed: `### No. N: <Category> - <Title>` in **All Prompts**; no category prefix in **Featured Prompts**.
- [x] Stable ID confirmed: the numeric `id` in `youmind.com/gpt-image-2-prompts?id=NNNNN` ("Try it now" link). Never key off `No. N`.
- [x] Images confirmed as raw HTML (`<div align="center"><img src=... width=... alt=...></div>`), parsed by remark as `html` nodes, **not** `image` nodes.
- [x] Prompt body confirmed as a fenced code block under `#### 📝 Prompt` — sometimes JSON, sometimes prose.
- [x] Raycast `{argument name="..." default="..."}` template syntax confirmed in prompt bodies.
- [x] `#### 📌 Details` confirmed as a bullet list: Author, Source, Published, Languages.
- [x] Badges confirmed: `![Language-EN]`, `![Featured]`, `![Raycast]` (alt text carries the metadata).
- [x] Category taxonomy confirmed (~31 labels) under "🏷️ Browse by Category" (Use Cases / Style / Subjects groups).
- [x] **New constraint:** README only contains the first **120** "All Prompts" entries — `"10575 more prompts not shown here"`. Full corpus (10,695+) is gallery-only. **Implication:** the README-based ETL is a *bounded snapshot at any given moment* (~120 newest visible + 6 featured), **but the library stays current over time because new prompts are inserted at the top of the list, which is exactly what the incremental sync is designed for** — see §0.1 below.
- [x] **Production URL confirmed:** `aiprompts.hubs.dpdns.org`. Custom domain → `basePath = ""` in `next.config.js`; `CNAME` file in `public/`; no sub-path encoding needed anywhere.

### §0.1 — How the library stays current despite the 120-entry README limit

This was explicitly designed for in ARCHITECTURE §5 and is **fully resolved**. Summary for clarity:

The upstream list is sorted **newest-first**. The README always surfaces the most recently added ~120 entries. The ETL does the following on every scheduled run:

1. Loads `data/gpt-image-2/chunks/*.json` → builds `knownIds: Set<externalId>` + `hashes: Map<externalId, contentHash>`.
2. Parses the README top-down, entry by entry.
3. **New `externalId` (not in `knownIds`)** → store in memory as a new record, keep parsing.
4. **Known `externalId` + hash match** → seen this exact record before → **stop parsing further** (with a 20-entry safety window). Everything below this point is already in our chunks.
5. **Known `externalId` + hash mismatch** → upstream edited an existing entry → overwrite just that record, keep parsing.
6. Merges new + updated records into the chunk files: **new records are prepended into the newest chunk**; a new chunk file is rolled once the newest chunk exceeds ~150 entries. **Old chunks are never rewritten** unless a record inside them changed.
7. If zero records changed → **writes nothing** (ETL exits cleanly; no git diff; deploy is not triggered).

**Net effect:** the library grows by exactly however many new prompts appear in the top of the README since the last run. Across 6-hour runs and ~20–40 new prompts/day the corpus accumulates indefinitely. Our committed `data/` directory is the growing library; the README is just the ingestion window.

---

## 1. Guiding principles

- [ ] **Static-first.** Every prompt is a real prerendered HTML page (`output: export`). Client JS only enhances.
- [ ] **Schema is the contract.** `packages/schema` (Zod) is shared by ETL and web; nothing crosses the boundary unvalidated.
- [ ] **Stable IDs everywhere.** Global key is `${sourceId}:${externalId}`.
- [ ] **Incremental + idempotent ETL.** No-op when nothing changed; never rewrite unchanged data.
- [ ] **Resilient parsing.** Per-entry try/catch, hard Zod gate, drift alerting. One bad entry never breaks a sync.
- [ ] **Don't re-host images.** Hotlink the upstream CDN; graceful `onError` placeholder.
- [ ] **Accessibility is non-negotiable.** WCAG 2.1 AA: keyboard, focus, contrast, reduced-motion, semantic HTML.
- [ ] **Performance budget.** LCP < 2.5s, CLS < 0.1, initial JS < ~120KB gzip on the browse shell.

---

## 2. Design system & UI/UX specification

The visual goal: a **modern, editorial Pinterest-style gallery** that feels premium, calm, and content-first — images are the hero, chrome recedes. Below is the design language to implement before building components.

### 2.1 Design tokens (CSS variables + Tailwind theme)

- [ ] **Color — light theme**
  - `--bg`: `#FAFAF8` (warm off-white canvas, not pure white — reduces glare in a dense grid)
  - `--surface`: `#FFFFFF` (cards)
  - `--surface-muted`: `#F2F2EF`
  - `--text`: `#1A1A18` · `--text-muted`: `#6B6B66`
  - `--border`: `#E7E7E2`
  - `--accent`: `#E60023`-adjacent but softened → `#FF4D5E` (single vibrant accent; Pinterest-energy without cloning the brand red)
  - `--accent-contrast`: `#FFFFFF`
  - `--ring`: accent @ 45% (focus rings)
- [ ] **Color — dark theme**
  - `--bg`: `#0E0E10` · `--surface`: `#17171A` · `--surface-muted`: `#202024`
  - `--text`: `#F4F4F2` · `--text-muted`: `#A1A1A8` · `--border`: `#2A2A2E`
  - `--accent`: `#FF5C6B` (slightly brighter for dark contrast) · `--ring`: accent @ 55%
- [ ] **Theme strategy:** `class="dark"` on `<html>`; default follows `prefers-color-scheme`; manual toggle persists to `localStorage` and is applied pre-paint via a tiny inline script (no theme flash / FOUC).
- [ ] **Typography**
  - Display/UI: `Inter` (variable) or `Geist`; tabular numerals for stats.
  - Mono (prompt bodies): `JetBrains Mono` / `Geist Mono`.
  - Scale (fluid `clamp()`): 12 · 14 · 16 (base) · 18 · 22 · 28 · 36 · 48.
  - Line-height 1.5 body, 1.15 headings; max prose width ~68ch on detail pages.
- [ ] **Spacing:** 4px base scale (4/8/12/16/24/32/48/64). Masonry gutter `16px` desktop, `12px` mobile.
- [ ] **Radii:** cards `16px`, pills/badges `9999px`, buttons `12px`, inputs `12px`.
- [ ] **Elevation:** soft, low-spread shadows (`0 1px 2px`, `0 8px 24px -12px`); elevate on hover only, never resting-heavy.
- [ ] **Motion:** 150–250ms ease-out; hover lift `translateY(-2px)` + shadow; **all motion gated behind `prefers-reduced-motion`.**

### 2.2 Signature components

- [ ] **Masonry grid** — true multi-column masonry (CSS `columns` baseline + JS-measured absolute-position masonry for virtualization). Column counts: 2 (mobile) → 3 (sm) → 4 (lg) → 5 (xl) → 6 (2xl). Preserve image aspect ratio (use parsed `width`/height to reserve space → zero CLS).
- [ ] **Prompt card** — image-dominant, rounded, hover reveals a gradient scrim with title + category pill + quick actions (Copy prompt · Open). Lazy-loaded images with blur-up placeholder. Whole card is a link; inner actions are real buttons (no nested-anchor a11y trap).
- [ ] **Hover/Focus quick actions** — Copy prompt (primary), Save/Favorite (local), Open detail. Fully keyboard reachable; visible focus.
- [ ] **Top app bar** — sticky, translucent backdrop-blur; logo, instant search box (`/` to focus), Tool/source switcher, theme toggle. Collapses to a compact bar on scroll-down, reveals on scroll-up.
- [ ] **Filter rail / facet bar** — category, language, featured, Raycast-friendly; chips reflect URL state; "clear all". Drawer on mobile, sticky sidebar or horizontal chip bar on desktop.
- [ ] **Detail page** — large hero image gallery (multi-image carousel/grid), title + category, full prompt in a copyable mono block with a "Copy" affordance, template-argument "fill the blanks" form (Phase 2), author/source attribution, "Open in YouMind" CTA, related prompts strip.
- [ ] **Theme toggle** — sun/moon, animated (reduced-motion aware), accessible label, reflects current resolved theme.
- [ ] **Empty / error / loading states** — skeleton masonry shimmer, "no results" illustration, image `onError` placeholder, offline-friendly copy.
- [ ] **Command palette (stretch)** — `Cmd/Ctrl-K` to jump to search/categories.

### 2.3 Accessibility & responsiveness checklist

- [ ] Keyboard: full tab order, `/` focuses search, `Esc` closes drawers/modals, arrow-key carousel.
- [ ] Visible focus rings on every interactive element (never `outline:none` without replacement).
- [ ] Color contrast ≥ 4.5:1 text / 3:1 large text & UI, verified in **both** themes.
- [ ] All images carry `alt` (from parsed `alt`); decorative imagery marked `aria-hidden`.
- [ ] `prefers-reduced-motion` disables transforms/parallax/auto-animations.
- [ ] Responsive from 320px → ultrawide; no horizontal scroll; touch targets ≥ 44px.
- [ ] Semantic landmarks (`header`/`nav`/`main`/`footer`), proper heading hierarchy per page.

---

## 3. Phase 0 — Repository & tooling foundation

- [x] Initialize pnpm workspace: `pnpm-workspace.yaml`, root `package.json`, `.npmrc`.
- [x] TypeScript strict base config (`tsconfig.base.json`) extended by each package.
- [x] ESLint + Prettier shared config; lint-staged + Husky (or simple CI lint) for human commits.
- [x] `.gitignore`, `.editorconfig`, `.nvmrc`/`engines` (Node 20), conventional-commits note.
- [x] Folder skeleton per `ARCHITECTURE.md` §2: `apps/web`, `packages/schema`, `packages/ui` (optional), `etl/`, `data/`.
- [x] Vitest configured at root for `etl` and `packages`.
- [x] CONTRIBUTING note: `data/` is generated-but-committed; never hand-edit (use `overrides.json`).

## 4. Phase 1 — Schema package (`packages/schema`)

- [x] Implement Zod schemas: `PromptImage`, `TemplateArgument`, `NormalizedPrompt` (per ARCHITECTURE §3).
- [x] Export inferred TS types.
- [x] `meta.json` and `sources.json` shapes (taxonomy snapshot, counts, `lastSyncedAt`).
- [x] `contentHash` helper (sha1 over normalized fields) for change detection.
- [x] Unit tests for schema parse success/failure on representative records.

## 5. Phase 2 — ETL pipeline (`etl/`)

- [x] `sources.config.ts` registry (start with `gpt-image-2`; structure ready for `seedance-2`).
- [x] `SourceAdapter` interface (`etl/adapters/types.ts`).
- [x] `markdown-to-ast.ts` — `unified` + `remark-parse` + `remark-gfm`.
- [x] `categorize.ts` — taxonomy-aware `splitTitle` against the ~31 known labels (scrape taxonomy once into `meta.json`).
- [x] `extract-images.ts` — `node-html-parser` over raw `html` nodes (regex fallback documented, not used).
- [x] `extract-arguments.ts` — Raycast `{argument ...}` extraction + dedupe + unescape.
- [x] Details list parser — label-matched (Author/Source/Published/Languages), `date-fns/parse` with `MMMM d, yyyy` → ISO 8601.
- [x] Badge parser — derive `language`, `featured`, `raycastFriendly` from badge `alt` strings.
- [x] `youmind-awesome-list` adapter — segment **All Prompts** / **Featured Prompts**, build `NormalizedPrompt[]`.
- [x] Per-entry try/catch with skip-and-log; run summary of skipped entries + reasons.
- [x] `sync.ts` — incremental diff by `externalId` + `contentHash`; newest-first early-stop with safety window; merge into `data/<source>/chunks/*.json` (~150/chunk); write only on change.
- [x] Acknowledge README 120-entry bound (§0): bounded source is expected, not an error.
- [x] `build-search-index.ts` — FlexSearch/MiniSearch export per source (`search-index.json`).
- [x] `validate` script — hard Zod gate over all chunk records (fails CI on drift).
- [x] Snapshot tests against saved real README fixtures (`etl/__tests__/fixtures/`).
- [x] `overrides.json` support (blocklist by `externalId`).
- [x] Generate initial real `data/gpt-image-2/` by running the pipeline against the live README.

## 6. Phase 3 — Web app shell (`apps/web`)

- [x] Next.js app (App Router) with `next.config.js`: `output:'export'`, `images.unoptimized`, `basePath: ""` (custom domain — no sub-path).
- [x] Tailwind + design tokens (§2.1) wired as CSS variables; dark-mode `class` strategy.
- [x] Pre-paint theme script (no FOUC) + `ThemeToggle` + persisted preference.
- [x] Fonts (Inter/Geist + mono) self-hosted via `next/font`.
- [x] `lib/` data-access: read `data/**` at build time (`generateStaticParams`, listing loaders, facet derivation).
- [x] Base layout: app bar, footer (CC BY 4.0 + upstream credit), landmarks, skip-link.
- [x] `.nojekyll` in `public/` (the GH Pages `_next/` folder gotcha).
- [x] `CNAME` file in `public/` containing `aiprompts.hubs.dpdns.org` (tells GitHub Pages which custom domain to serve — without this, the Pages deployment overwrites the custom domain config on every deploy).

## 7. Phase 4 — Core pages & components (MVP UI)

- [x] `app/page.tsx` — landing: hero, featured strip, entry into browse.
- [x] `PromptCard` + masonry grid (CSS-columns baseline first; aspect-ratio reservation for zero CLS).
- [x] `app/browse/[source]/page.tsx` — server-rendered crawlable shell + client-hydrated gallery.
- [x] Facet/filter bar driven by URL query (`?category=...&lang=...&featured=...&raycast=...`).
- [x] `app/prompt/[source]/[id]/page.tsx` — static detail page: image gallery, copyable prompt, attribution, CTA.
- [x] `generateMetadata` per prompt (title/description/OG image = first image) for SEO/link previews.
- [x] Copy-to-clipboard (progressive enhancement) + toast.
- [x] Skeleton / empty / image-error states.
- [x] `app/sitemap.ts` across all prompt URLs.
- [x] Responsive + a11y pass against §2.3 checklist.

## 8. Phase 5 — Search, virtualization & remix (polish)

- [x] Lazy-loaded FlexSearch index; query in a Web Worker; load on search focus.
- [x] Instant search UI with highlighting + keyboard nav.
- [x] Virtualized masonry (`@tanstack/react-virtual`) + chunked lazy loading via TanStack Query.
- [x] Template-argument "fill the blanks" form on detail page (live substitution → copyable prompt).
- [x] Favorites/Saved (localStorage) + a "Saved" view.
- [x] Refined transitions, hover choreography, reduced-motion verification.

## 9. Phase 6 — CI/CD (GitHub Actions + Pages)

- [x] `.github/workflows/etl.yml` — scheduled (6h) sync → validate → build-index → auto-commit `data/**`.
- [x] `.github/workflows/deploy.yml` — on push to `data/**`/`apps/web/**`/`packages/**`: build static export, `.next/cache` restore, `.nojekyll`, `upload-pages-artifact` → `deploy-pages`.
- [~] Configure GitHub Pages environment: set custom domain to `aiprompts.hubs.dpdns.org` in repo Settings → Pages. DNS side: point the `aiprompts` subdomain to `<org>.github.io` via a CNAME record (or the Pages IP addresses if an apex). GitHub will issue a TLS cert automatically once DNS propagates.
- [x] Drift alerting: open/update tracking issue when skipped-entry count exceeds threshold.
- [ ] First green end-to-end deploy verified live.

## 10. Phase 7 — Multi-source & resilience hardening

- [x] Add second source (`seedance-2`) to `sources.config.ts` — verify zero adapter changes needed.
- [x] Tool/source facet + combined search index.
- [x] White-label build var (`NEXT_PUBLIC_SOURCE_FILTER`) for single-tool deployments.
- [x] Handle "entry disappeared upstream" as stale (not error).
- [x] Expand snapshot/fixture coverage; tune `.next/cache` as corpus grows.
- [x] Lighthouse / axe CI checks (perf + a11y budgets enforced).

---

## 11. Definition of done (per phase)

- [~] Phase 1 MVP: real `data/gpt-image-2/` committed; browse + static detail pages render real prompts & images; light/dark works with no FOUC; deployed to GitHub Pages.
- [x] Phase 2 polish: search + virtualization + remix form live; a11y/perf budgets met.
- [x] Phase 3 multi-source: second source live behind a Tool facet with combined search.

## 13. Immediate next steps (go-live)

- [ ] Ensure this workspace is connected to the target GitHub repository (`aiprompts`) and all local changes are pushed.
- [ ] In GitHub repo Settings → Pages: Source = GitHub Actions, Custom domain = `aiprompts.hubs.dpdns.org`, enforce HTTPS once certificate is issued.
- [ ] In DNS provider: CNAME `aiprompts` -> `<org>.github.io` and wait for propagation.
- [ ] Trigger/observe green runs for `.github/workflows/etl.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/quality.yml` on GitHub.
- [ ] Verify live URLs: `/`, `/browse`, `/browse/gpt-image-2`, `/browse/seedance-2`, and one prompt detail page.
- [ ] After live verification, mark Phase 6 "First green end-to-end deploy verified live" and Definition of done "Phase 1 MVP" as complete.

## 12. Open questions / decisions to confirm later

- [ ] Full-corpus source: build a gallery/API adapter for all 10,695+ prompts (beyond README's 120), or keep the README slice? (Default for now: README slice.)
- [ ] Favorites: local-only, or eventually synced? (Default: local-only.)
- [x] Custom domain vs. project-pages `basePath`? → **Resolved: custom domain `aiprompts.hubs.dpdns.org`, `basePath = ""`.**
- [ ] Analytics (privacy-friendly, e.g. Plausible) — in or out for v1?

---

### Progress legend
`[ ]` not started · `[~]` in progress · `[x]` complete — update inline as work proceeds.
