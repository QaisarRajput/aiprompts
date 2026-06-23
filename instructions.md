# AI Agent Instructions — GitHub Pages Application Standard

> **Audience:** AI coding agents receiving a build or implementation-plan task.
> **Scope:** Any content-heavy, data-driven, serverless application deployed to GitHub Pages.
> **Usage:** Read this file first. Every decision below is a constraint, not a suggestion. Deviate only when the user explicitly overrides a rule in the current session.

---

## 1. Project structure — always a pnpm monorepo

```
<project-root>/
├── apps/
│   └── web/                  # Next.js app (output: export)
├── packages/
│   └── schema/               # Zod schemas + TS types, shared by etl + web
├── etl/                      # Data pipeline (Node-only; web must never import from here)
├── data/                     # COMMITTED to git — generated but version-controlled
├── .github/workflows/
│   ├── etl.yml               # data sync (scheduled)
│   └── deploy.yml            # build + deploy (triggered by data/** push)
├── pnpm-workspace.yaml
└── package.json
```

**Rules:**
- Use **pnpm workspaces**. Never npm or yarn.
- `packages/schema` is the only cross-boundary import allowed between `etl/` and `apps/web/`.
- `etl/` packages must never appear in `apps/web/` dependencies. Enforce via workspace isolation.
- `data/` is committed to git. Never `.gitignore` it. It is the local dev fixture and the diff-auditable source of truth.

---

## 2. Framework — Next.js static export, not a plain SPA

**Rule:** Use **Next.js with `output: 'export'`** for any content gallery, prompt library, documentation site, or data-browsing application targeting GitHub Pages.

Never use Create React App, Vite SPA, or similar client-only scaffolds for these use cases.

**Why this matters (tell the agent, once, so it does not re-argue):**
- Static export produces real HTML per route — crawlers, link-preview bots, and users without JS all get content.
- Routing works without the `404.html` SPA-fallback hack.
- `generateStaticParams` + `generateMetadata` give per-page SEO for free at build time.
- Build output is still 100% static files — identical deployment model to a SPA.

**`next.config.js` baseline (always start here):**
```js
/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  images: { unoptimized: true },   // no image server in static export
  basePath: '',                     // '' for custom domain; '/repo-name' for <org>.github.io/<repo>
};
```

Set `basePath` based on the confirmed production URL:
- Custom domain (e.g. `example.com`) → `basePath: ''`
- Project Pages without custom domain (e.g. `org.github.io/repo`) → `basePath: '/repo'`

**Required files in `apps/web/public/`:**
- `.nojekyll` — empty file, prevents GitHub Pages from suppressing `_next/` via Jekyll.
- `CNAME` — one line containing the custom domain (e.g. `aiprompts.hubs.dpdns.org`). Without this, every Pages deploy resets the custom domain setting.

---

## 3. Rendering model — hybrid static + client enhancement

Apply this pattern to every page type:

| Page type | Rendering strategy |
|---|---|
| Detail / content page | Fully static. `generateStaticParams` enumerates all IDs at build time. `generateMetadata` produces per-page title, description, OG image. No `'use client'` at the page level. |
| Listing / browse page | Thin static server shell (a few real `<a>` tags for crawlability + no-JS fallback) that hydrates into a rich client experience (search, filters, infinite scroll). |
| Landing / home page | Static. Hero, featured items, entry CTAs. |
| Sitemap | `app/sitemap.ts` — generated at build time across all content URLs. Always include this. |

**Build-time data access rule:** At build time, read `data/**` directly from the filesystem using `fs`. Never `fetch()` local JSON at build time — it adds unnecessary HTTP overhead and fails in some CI environments. `fetch()` is only for client-side chunk loading at runtime.

**`output: export` hard constraint:** Every URL must be pre-generated at build time. If a URL is not emitted by `generateStaticParams`, it 404s. There is no ISR or on-demand rendering. Mitigate build time growth by caching `.next/cache` between CI runs (see §8).

---

## 4. TypeScript — strict mode everywhere

```json
// tsconfig.base.json (extended by all packages)
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

**Rules:**
- `strict: true` is non-negotiable. Never disable it.
- No `any` unless explicitly casting with a comment explaining why.
- Infer types from Zod schemas with `z.infer<typeof Schema>` — do not write parallel manual types.
- Shared types live only in `packages/schema`. Never duplicate type definitions across packages.

---

## 5. Schema — Zod as the cross-boundary contract

Every record that crosses the ETL → web boundary must be defined as a Zod schema in `packages/schema` and validated at parse time in the ETL.

**Pattern:**
```ts
// packages/schema/src/prompt.ts
import { z } from 'zod';
export const MyRecord = z.object({ ... });
export type MyRecord = z.infer<typeof MyRecord>;
```

**Rules:**
- The ETL runs `Schema.parse()` (throws) or `Schema.safeParse()` (catch + log) on every record.
- A validation script (`pnpm --filter etl run validate`) re-validates all committed chunk files. This runs in CI before any deploy.
- Schema changes are breaking changes. Version them deliberately.
- Include a `contentHash: z.string()` field on any record that participates in incremental diffing (sha1 of the normalized content fields, not the whole object including metadata).

---

## 6. Static data strategy — committed, versioned, idempotent

GitHub Pages has no server, no database, and no runtime API. All data must be available at build time as files in the repository or fetched client-side.

**Choose one of these patterns based on corpus size and update frequency:**

| Pattern | When to use | How |
|---|---|---|
| **Committed JSON** | < ~50 MB total, infrequent manual updates | Author/generate JSON files, commit to `data/`. Build reads directly via `fs`. |
| **CI-synced JSON** | Regularly updated from external source | Scheduled CI job fetches + normalizes + commits `data/**`. Deploy job triggers on that commit. |
| **Client-fetched JSON** | Large corpus, stale-on-load acceptable | Build generates an index/manifest; full data fetched in chunks at runtime via `fetch()`. |
| **External API** | Real-time data required | `fetch()` from client at runtime. Accept that content is invisible to crawlers; mitigate with SSG summary cards at build time. |

**Universal rules regardless of pattern:**
- **Stable IDs.** Never key records by position or rank. Use the upstream system's own permanent identifier. If none exists, derive a deterministic slug from the content (e.g. `slugify(title)`). Positional IDs break routing whenever the source is reordered.
- **Idempotent generation.** Running the generation/sync script twice must produce the same output. No timestamps in content hashes.
- **If nothing changed, write nothing.** Avoid committing zero-diff files — it pollutes `git log` and triggers unnecessary deploys.
- **Include a `contentHash`** on any record that participates in change detection. Compute as sha1/sha256 of the normalized content fields (not metadata like `lastSyncedAt`).
- **`data/` is generated; never hand-edit it.** Curation and overrides belong in a separate `overrides.json` (blocklist / patch file) that the generator reads and applies.

---

## 7. External data ingestion — safety rules

Whenever the application ingests data from an external source (API, scraped page, CSV, community-maintained file), apply these rules:

**Parsing:**
- Use a proper parser for the source format — never regex unstructured text. Markdown → `remark`, HTML → `node-html-parser` or `cheerio`, CSV → `papaparse`, JSON → `JSON.parse` + Zod validation.
- For date strings: use an explicit format (e.g. `date-fns/parse` with a format string). Never `new Date(untrustedString)` — locale-dependent and silently produces `Invalid Date`.

**Error isolation:**
- Wrap each record's extraction in `try/catch`. One malformed entry must never abort processing of the rest.
- Skip-and-log bad entries. Emit a run summary that lists every skipped entry with its error.
- Set a threshold: if skipped entries exceed N% of the run, fail CI and open a tracking issue. Silent degradation is unacceptable.

**Trust boundary:**
- Treat all external data as untrusted. Run Zod validation at the ingestion boundary before any record touches `data/` or the app.
- Sanitize any field that will be rendered as HTML (use `DOMPurify` client-side or a server-side equivalent). Never `dangerouslySetInnerHTML` raw external content.
- Strip or encode user-controlled URL fields before rendering as `href`. Validate scheme is `https:` or `http:` — reject `javascript:`, `data:`, etc.

---

## 8. CI/CD — two workflows, strictly separated

**`etl.yml` — data sync (mutates the repo):**
- Trigger: `schedule` (cron) + `workflow_dispatch`.
- Steps: install → sync → validate → build-index → auto-commit `data/**` if changed.
- Permissions: `contents: write`.
- Use `stefanzweifel/git-auto-commit-action` for the commit step — it is a no-op when nothing changed.
- Bot commit identity: a named bot user (e.g. `prompt-gallery-bot`) to keep `git log` readable.

**`deploy.yml` — build + deploy (reads the repo, produces artifact):**
- Trigger: `push` to `main` on paths `data/**`, `apps/web/**`, `packages/**` + `workflow_dispatch`.
- Permissions: `contents: read`, `pages: write`, `id-token: write`.
- Concurrency group: `pages` with `cancel-in-progress: true`.
- Steps: install → restore `.next/cache` → build → `touch out/.nojekyll` → `upload-pages-artifact` → `deploy-pages`.
- Use official `actions/upload-pages-artifact` + `actions/deploy-pages`. No third-party deploy actions.

**Build cache:**
```yaml
- uses: actions/cache@v4
  with:
    path: apps/web/.next/cache
    key: nextjs-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-${{ github.sha }}
    restore-keys: |
      nextjs-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}-
```
This is the primary lever for keeping build time sane as the corpus grows. Always include it.

**Drift alerting:** If the number of skipped/invalid records in an ETL run exceeds a threshold (e.g. 3 absolute or 1% of new entries), open or update a tracking GitHub Issue via `actions/github-script`. Silent failures are unacceptable.

---

## 9. Design system — tokens first, components second

**Always define design tokens as CSS custom properties before writing any component.** Wire them into Tailwind via `theme.extend`.

**Baseline token set:**
```css
/* Light */
--bg: #FAFAF8;          /* warm off-white canvas */
--surface: #FFFFFF;
--surface-muted: #F2F2EF;
--text: #1A1A18;
--text-muted: #6B6B66;
--border: #E7E7E2;
--accent: #FF4D5E;       /* single vibrant accent */
--accent-contrast: #FFFFFF;

/* Dark (applied via .dark on <html>) */
--bg: #0E0E10;
--surface: #17171A;
--surface-muted: #202024;
--text: #F4F4F2;
--text-muted: #A1A1A8;
--border: #2A2A2E;
--accent: #FF5C6B;       /* slightly brighter for dark contrast */
```

**Theme strategy:**
- Dark mode via `class="dark"` on `<html>` (Tailwind `darkMode: 'class'`).
- Default resolves from `prefers-color-scheme` via a tiny inline `<script>` in `<head>` — runs before paint, eliminates theme flash (FOUC). This script reads `localStorage` and falls back to the media query.
- Manual toggle persists to `localStorage`.

**Typography:**
- UI font: `Inter` variable (or `Geist`) via `next/font/google`. Self-hosted, no external request.
- Monospace (code/prompt bodies): `JetBrains Mono` or `Geist Mono`.
- Use fluid `clamp()` type scale. Never fixed px font sizes.

**Motion rule:** Every transform, transition, and animation must be gated behind `@media (prefers-reduced-motion: no-preference)` or a `useReducedMotion` hook. Hover lifts, skeleton shimmers, and carousel animations all fall under this rule.

**Spacing:** 4px base scale (4/8/12/16/24/32/48/64). Masonry gutters: 16px desktop, 12px mobile.

**Radii:** cards `16px`, badges/pills `9999px`, buttons/inputs `12px`.

**Elevation:** Shadows are soft and low-spread. Never apply heavy resting shadows. Elevate only on hover/focus.

---

## 10. Component patterns

**Masonry gallery:**
- CSS `columns` as the baseline (works with no JS).
- Upgrade to JS-measured absolute-position masonry only when adding virtualization.
- Column counts: 2 → 3 → 4 → 5 → 6 across breakpoints (mobile → 2xl).
- Always reserve aspect-ratio space for images using parsed `width`/`height` to prevent CLS.

**Cards:**
- Image-dominant. The card is a `<a>` wrapping the whole tile.
- Overlay actions (Copy, Save) are `<button>` elements inside the anchor — use `e.preventDefault()` + `stopPropagation()` as needed. Never nest `<a>` inside `<a>`.
- Lazy-load images (`loading="lazy"`). Provide a blur placeholder.

**App bar:**
- Sticky, translucent, `backdrop-filter: blur(...)`.
- Collapse on scroll-down, reveal on scroll-up.
- Contains: logo, search input (`/` shortcut to focus), source/tool switcher, theme toggle.

**Virtualization:** Use `@tanstack/react-virtual` for any list exceeding ~50 DOM nodes. Pair with TanStack Query for chunked data fetching.

**Search:**
- Index built at ETL time (FlexSearch or MiniSearch) over `title + description + promptText + author.name`.
- Lazy-load the index (fetch only when search input is focused).
- Run queries in a Web Worker — never block the main thread.

**Filter/facet state:** Drive entirely via URL query string (`?category=...&lang=...`). Filters must be shareable links. Parse on mount, push on change.

---

## 11. Accessibility — WCAG 2.1 AA minimum

These are not optional polish items. Enforce before shipping.

- Every interactive element has a visible focus ring (never `outline: none` without a custom replacement).
- Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI components — verified in both light and dark themes.
- All images carry meaningful `alt` text from the data. Decorative images: `alt=""` + `aria-hidden="true"`.
- Keyboard: full tab order, `Esc` closes any drawer/modal, arrow keys navigate carousels, `/` focuses search.
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`. One `<h1>` per page. Logical heading hierarchy.
- Touch targets ≥ 44×44px on mobile.
- Responsive from 320px → ultrawide. No horizontal overflow.

---

## 12. SEO

- `generateMetadata` on every static page: `title`, `description`, `openGraph.images` (first content image), `openGraph.type: 'article'` for detail pages.
- `app/sitemap.ts`: generate across all content URLs at build time. Include `lastModified` from the data's `publishedAt` or `lastSyncedAt`.
- Canonical URLs: always absolute, using the confirmed production domain.
- Structured data (`application/ld+json`) on detail pages: `Article` or `CreativeWork` schema with `author`, `datePublished`, and `image`.
- No client-side-only metadata. All SEO-critical content must be in the prerendered HTML.

---

## 13. Attribution & legal

When redistributing community-contributed content:
- Surface `author.name` + `author.url` and `source.label` + `source.url` on every detail page.
- Render a visible footer credit: `"Data sourced from <upstream-repo>, CC BY 4.0"` with a link to the upstream repo and the license.
- Never re-host third-party CDN assets. Hotlink original URLs. Add an `onError` fallback placeholder.
- Handle content removal: if a record disappears from the upstream source, mark it `stale: true` in the chunk rather than deleting it — prevents dead URLs and allows graceful "no longer available" UI.

---

## 14. Code style & commit conventions

- **Formatter:** Prettier. Config at repo root. Run on save. Enforced in CI.
- **Linter:** ESLint with `@typescript-eslint/recommended`. No warnings in CI — all lint issues are errors.
- **Commits (human-authored):** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- **Bot commits:** Identified by author name (e.g. `prompt-gallery-bot`) with a `chore(data):` prefix. This keeps `git log` readable.
- **`data/` is generated.** Never hand-edit chunk files. Curation belongs in `data/<source>/overrides.json` (a blocklist by stable ID) that the ETL reads and respects.
- **Test framework:** Vitest. Snapshot tests for parsers against real saved fixture data. Unit tests for schema validation and ID-derivation logic.

---

## 15. Implementation plan format

When asked to produce an implementation plan for a project matching this pattern, structure it as follows:

1. **§0 Source / data validation** — verify the upstream source before designing. Record confirmed facts that constrain the design (entry format, ID strategy, field locations, license).
2. **§0.N — How [specific constraint] is resolved** — for any non-obvious constraint, add a dedicated sub-section explaining the exact mechanism before listing tasks.
3. **Guiding principles** — enumerate the non-negotiable rules for the project.
4. **Design system spec** — token values, theme strategy, typography, motion rules. Written before component tasks.
5. **Phases** — each phase is a flat list of checkboxes. One task = one checkbox. No nested subtasks more than one level deep.
6. **Definition of done** — one checkbox per phase milestone. What "done" means must be observable (deployed URL, green CI, verified feature).
7. **Open questions** — unresolved decisions that would block implementation. Mark resolved ones inline as they are answered.
8. **Immediate next steps** — the 5–7 actions needed right now to unblock Phase 1.

Checkbox states: `[ ]` not started · `[~]` in progress · `[x]` complete.
