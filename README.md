<div align="center">
  <img src="apps/web/public/logo.png" alt="AI Prompts" width="300" />
  <p><strong>Discover • Create • Inspire</strong></p>
  <p>The most fire AI image prompts on the internet. Curated daily, ready to copy.</p>

  <br/>

  [![Deploy](https://github.com/your-org/aiprompts/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/aiprompts/actions/workflows/deploy.yml)
  [![ETL](https://github.com/your-org/aiprompts/actions/workflows/etl.yml/badge.svg)](https://github.com/your-org/aiprompts/actions/workflows/etl.yml)
  [![License: CC BY 4.0](https://img.shields.io/badge/data-CC%20BY%204.0-lightblue)](https://creativecommons.org/licenses/by/4.0/)

  <br/>

  **[🌐 aiprompts.hubs.dpdns.org](https://aiprompts.hubs.dpdns.org)** · [Instagram](https://instagram.com/aipromptshub) · [TikTok](https://tiktok.com/@aipromptshub) · [X](https://x.com/aipromptshub) · [Facebook](https://facebook.com/aipromptshub)
</div>

---

## What is this?

**AI Prompts** is a blazing-fast, open-source gallery for AI image prompts — no login, no paywall, just vibes. Browse 200+ hand-curated prompts for tools like GPT Image 2 and Seedance 2, filter by style or category, and copy with one click.

The whole site is statically generated and auto-updated via a GitHub Actions pipeline every 6 hours, so you're always seeing the freshest drops.

---

## Features

- 🔥 **Always fresh** — ETL pipeline syncs upstream repos on a 6-hour schedule
- 🔍 **Instant search** — Web Worker-powered MiniSearch, no server needed
- ♾️ **Infinite scroll** — Loads more as you scroll, no pagination buttons
- 🌗 **Dark / light mode** — Follows your OS preference, zero flash
- 📱 **Fully responsive** — Looks clean from 320px to ultrawide
- ⚡ **Static-first** — Every prompt has its own prerendered HTML page
- ♥ **Save for later** — Favorites live in your localStorage
- 🎨 **Multi-source** — GPT Image 2 + Seedance 2, more tools coming

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, `output: export`) |
| Styling | Tailwind CSS v3 + CSS variables |
| Monorepo | pnpm workspaces |
| Language | TypeScript (strict) |
| Schema | Zod |
| ETL parser | unified / remark |
| Search | MiniSearch (Web Worker) |
| Data fetching | TanStack Query (infinite pagination) |
| CI/CD | GitHub Actions + GitHub Pages |

---

## Project structure

```
aiprompts/
├── apps/
│   └── web/             # Next.js static site
│       ├── app/         # App Router pages
│       ├── components/  # React components
│       ├── lib/         # Build-time data access
│       ├── public/      # Static assets (logo, favicons)
│       └── workers/     # Web Worker for search
├── etl/                 # ETL pipeline (sync, index, validate)
│   ├── adapters/        # Per-source README parsers
│   └── __tests__/       # Adapter snapshot tests
├── packages/
│   └── schema/          # Shared Zod schemas + types
├── data/                # Generated prompt data (committed)
│   ├── gpt-image-2/     # GPT Image 2 chunks + meta
│   └── seedance-2/      # Seedance 2 chunks + meta
└── docs/                # Architecture + implementation plan
```

---

## Getting started

### Prerequisites

- Node.js ≥ 20
- corepack enabled (`corepack enable` — may need `sudo`)

### Install

```bash
corepack pnpm install
```

### Run the website locally

```bash
# Dev server (live reload)
corepack pnpm web:dev
# → http://localhost:3000
```

### Sync + index prompt data

```bash
# Full pipeline: sync from upstream → build indexes → validate
corepack pnpm etl

# Or step by step:
corepack pnpm etl:sync      # fetch + diff upstream READMEs
corepack pnpm etl:index     # build per-source + combined MiniSearch indexes
corepack pnpm etl:validate  # hard Zod gate over all chunk records
```

### Quality checks

```bash
corepack pnpm lint        # ESLint
corepack pnpm typecheck   # TypeScript (no emit)
corepack pnpm test        # Vitest (schema + adapter tests)
```

### Production build

```bash
corepack pnpm web:build   # Static export → apps/web/out/
```

---

## How the ETL works

The pipeline is designed so the library grows continuously even though upstream READMEs only show the latest ~120 entries.

```
Schedule (every 6h)
    │
    ▼
etl:sync  ──► fetch upstream README
              ├── parse entries top-down (newest first)
              ├── new ID     → write as new record
              ├── known ID + hash match → early-stop (already have it)
              ├── known ID + hash mismatch → overwrite
              └── save to data/<source>/chunks/*.json (~150/chunk)
    │
    ▼
etl:index ──► build per-source MiniSearch indexes
              └── build combined index across all sources
    │
    ▼
etl:validate ► Zod gate over every chunk record — fails CI on drift
    │
    ▼
auto-commit   (only if data actually changed — zero noise PRs)
    │
    ▼
deploy.yml    builds + deploys to GitHub Pages
```

---

## Data sources

| Source ID | Tool | Upstream repo |
|-----------|------|---------------|
| `gpt-image-2` | GPT Image 2 | [YouMind-OpenLab/awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2) |
| `seedance-2` | Seedance 2 | [YouMind-OpenLab/awesome-seedance-2-prompts](https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts) |

All data is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) with attribution to the original contributors.

---

## Deployment

The site deploys automatically to GitHub Pages on every push to `main` that touches `data/**`, `apps/web/**`, or `packages/**`.

### Manual deploy

```bash
corepack pnpm web:build
# Push apps/web/out/ to GitHub Pages
```

### GitHub Pages setup

1. Settings → Pages → Source: **GitHub Actions**
2. Custom domain: `aiprompts.hubs.dpdns.org`
3. DNS: CNAME `aiprompts` → `<your-org>.github.io`
4. Wait for TLS cert → enable **Enforce HTTPS**

---

## Adding a new source

1. Add an entry to `etl/sources.config.ts`
2. Check if the README format matches the existing adapter — if so, done
3. If different format: create `etl/adapters/your-adapter.ts` implementing `SourceAdapter`
4. Run `corepack pnpm etl` to validate
5. Add fixture in `etl/__tests__/fixtures/` and a snapshot test

---

## Contributing

- `data/` is generated and committed — never edit it by hand (use `overrides.json` to block specific entries)
- Follow conventional commits: `feat:`, `fix:`, `etl:`, `chore:`
- Run `corepack pnpm lint && corepack pnpm typecheck && corepack pnpm test` before pushing

---

## License

Code: MIT  
Data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — see individual source repositories for full attribution
