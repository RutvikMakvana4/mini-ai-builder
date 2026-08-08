# mini-ai-builder

Turns a natural-language prompt into a live, deployed Next.js + Tailwind application.

## Architecture

Prompt → LLM (structured output) → Sandbox (install/build/run) → AI repair loop on failure → Live preview → Deploy to Vercel

- **Frontend**: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Monaco Editor, SSE for live updates
- **Backend**: Node.js, Express, TypeScript, Zod
- **AI**: Vercel AI SDK + Claude, structured outputs (`generateObject`)
- **Sandbox**: Vercel Sandbox (isolated microVM per project)
- **Deployment**: Vercel REST API

## Structure

\`\`\`
apps/
web/ Next.js frontend
api/ Node.js backend (modular: projects, generation, sandbox, build, deployment, events)
\`\`\`

## Running locally

\`\`\`bash
pnpm install
pnpm dev:api # http://localhost:4000
pnpm dev:web # http://localhost:3000
\`\`\`

## Environment variables

**apps/api/.env**
\`\`\`
PORT=4000
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free

# Optional: override the model used per UI selection.

# Any left unset fall back to OPENROUTER_MODEL above.

OPENROUTER_MODEL_CLAUDE=
OPENROUTER_MODEL_GPT=
OPENROUTER_MODEL_GEMINI=
VERCEL_TOKEN=
VERCEL_TEAM_ID=
\`\`\`

**apps/web/.env.local**
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:4000
\`\`\`
