# Mini AI Builder

Turn a natural-language prompt into a live, deployed Next.js + Tailwind application — powered by free-tier LLMs, sandboxed builds with automatic self-repair, and real-time streaming updates.

## Live Demo

- **Frontend**: https://mini-ai-builder-xyz.vercel.app
- **Backend API**: https://mini-ai-builder.onrender.com/health

> Backend runs on Render's free tier — if it's been idle, the first request may take 30-60s to cold-start.

## How it works

```
Prompt
  ↓
AI generation (OpenRouter free-model chain, structured output)
  ↓
Sandbox (Vercel Sandbox: install → build → run)
  ↓
Build failure? → AI repair loop (max 2 attempts, patch-based)
  ↓
Live preview (streamed via SSE)
  ↓
One-click deploy to Vercel
```

The scaffolding (`package.json`, `tsconfig.json`, Tailwind/PostCSS config, `app/layout.tsx`, `app/globals.css`) is generated deterministically by the backend — the AI only writes `app/page.tsx` (and optional `components/*.tsx`), which keeps output small enough to fit reliably inside free-tier token budgets and eliminates an entire class of "AI wrote invalid config" failures.

## Architecture

| Layer      | Tech                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend   | Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Monaco Editor                                                                   |
| Backend    | Node.js, Express, TypeScript, Zod                                                                                                      |
| AI         | OpenRouter (free-model chain with automatic fallback) via Vercel AI SDK, structured output (`generateObject`), Response Healing plugin |
| Sandbox    | Vercel Sandbox (isolated Firecracker microVM per project)                                                                              |
| Deployment | Vercel REST API                                                                                                                        |
| Realtime   | Server-Sent Events (SSE)                                                                                                               |

### Backend structure (modular monolith)

```
apps/api/src/
  modules/
    projects/    — CRUD for projects, file read/update
    generation/  — POST /generate, kicks off AI generation
    build/       — build pipeline orchestration + AI repair loop
    sandbox/     — sandbox teardown
    deployment/  — POST /deploy, polls Vercel until READY/FAILED
    events/      — SSE event bus, one channel per project
  services/
    ai/          — AIService abstraction (OpenRouter implementation)
    sandbox/     — SandboxService abstraction (Vercel Sandbox implementation)
    deployment/  — DeploymentService abstraction (Vercel REST implementation)
  common/
    types/       — shared domain types (Project, BuildStatus, DeploymentStatus...)
    validation/  — Zod schemas for AI structured output and patches
    errors/      — AppError + centralized error-handling middleware
```

Each external integration (AI provider, sandbox provider, deployment target) sits behind an interface (`AIService`, `SandboxService`, `DeploymentService`). Controllers only ever call the interface — swapping providers means writing one new adapter file, not touching route logic.

## Key design decisions

- **AI generates as little as possible.** Only `app/page.tsx` and optional components are AI-authored; everything else is a static, always-valid template. This was the single biggest reliability win — free models struggle with multi-file, deeply-nested JSON output, so we removed that requirement entirely rather than fighting it.
- **Multi-model fallback chain, not a single model.** Free-tier model availability rotates weekly and individual models get rate-limited under load. Generation rotates through a configurable chain (`OPENROUTER_MODEL` + `OPENROUTER_FALLBACK_MODELS`) rather than depending on one model staying available.
- **Defense-in-depth output validation.** Every AI response passes through: markdown-fence stripping → statement-break normalization → known-typo auto-correction → brace-balance / truncation detection → elided-diff detection, before it's trusted enough to write to a sandbox.
- **Build failures are diagnosed, not just retried.** Dependency-install failures are treated as scaffold bugs (the AI never touches `package.json`, so it can't fix install errors) and fail fast; compile failures go through a bounded (2-attempt) AI repair loop with the actual build error fed back into the prompt.
- **Sandboxes are ephemeral by design.** Vercel Sandboxes expire after a timeout; the UI treats "preview unavailable" as an expected state with a one-click relaunch, not an error state.

## Project structure

```
mini-ai-builder/
  apps/
    web/   — Next.js frontend
    api/   — Node.js backend
  packages/  — (reserved for shared code, currently unused)
```

## Running locally

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- An [OpenRouter](https://openrouter.ai) account (free tier works)
- A [Vercel](https://vercel.com) account with a linked project (for Sandbox + Deployment APIs)

### Setup

```bash
git clone https://github.com/RutvikMakvana4/mini-ai-builder.git
cd mini-ai-builder
pnpm install
```

### Environment variables

**`apps/api/.env`**

```
PORT=4000
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_FALLBACK_MODELS=nvidia/nemotron-3-ultra-550b-a55b:free,openrouter/free
VERCEL_TOKEN=...
VERCEL_TEAM_ID=...
VERCEL_PROJECT_ID=...
FRONTEND_URL=http://localhost:3000
```

Get `VERCEL_TOKEN` from `vercel.com/account/tokens`. Get `VERCEL_TEAM_ID`/`VERCEL_PROJECT_ID` by running `vercel link` inside `apps/api` and checking `apps/api/.vercel/project.json` (`orgId` → `VERCEL_TEAM_ID`, `projectId` → `VERCEL_PROJECT_ID`).

**`apps/web/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Run

```bash
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:3000
```

## Deployment

- **Frontend** → Vercel (Root Directory: `apps/web`)
- **Backend** → Render (Root Directory: `apps/api`; free tier works, with cold-start caveat above)

See commit history / project notes for the full deployment walkthrough, including Express 5 wildcard-route syntax, Node ESM/CommonJS module resolution, and Render build-image quirks encountered along the way.

## Known limitations

- **Free-tier LLM reliability is genuinely inconsistent.** Free models rotate, get rate-limited, and occasionally produce truncated or malformed output despite the fallback chain and validation layers. This is an honest constraint of running entirely on $0 infrastructure, not a bug to be fully eliminated.
- **Sandboxes expire.** Preview links stop working after the sandbox's timeout window; use the relaunch (↻) button in the workspace to spin up a fresh one.
- **In-memory project store.** Projects are not persisted to a database — restarting the backend clears all projects. A real deployment would add Postgres/Redis here.
- **Render free-tier cold starts.** Expect a 30-60s delay on the first request after ~15 minutes of inactivity.

## License

MIT
