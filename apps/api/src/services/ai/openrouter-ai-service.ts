import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { AIService } from "./ai-service";
import {
  generatedProjectSchema,
  GeneratedProject,
} from "../../common/validation/generation";
import { patchSchema, Patch } from "../../common/validation/repair";
import { AppError } from "../../common/errors/app-error";
import { ModelProvider } from "../../common/types/project";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Fallback used for any provider that doesn't have its own override set.
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

// Maps the UI's model picker to real OpenRouter model IDs. Each can be
// overridden independently via env vars; anything left unset falls back to
// DEFAULT_MODEL so a single-model setup (per the PRD's "one provider" scope)
// keeps working out of the box.
const MODEL_MAP: Record<ModelProvider, string> = {
  claude: process.env.OPENROUTER_MODEL_CLAUDE || DEFAULT_MODEL,
  gpt: process.env.OPENROUTER_MODEL_GPT || DEFAULT_MODEL,
  gemini: process.env.OPENROUTER_MODEL_GEMINI || DEFAULT_MODEL,
};

function resolveModel(model: ModelProvider): string {
  return MODEL_MAP[model] || DEFAULT_MODEL;
}

// Without this, a bad model slug or a slow/rate-limited provider can leave
// generateObject() pending indefinitely — the request never resolves OR
// rejects, so the caller's try/catch never fires and the project silently
// sits at buildStatus: NOT_STARTED forever with no error surfaced anywhere.
const GENERATION_TIMEOUT_MS = 120_000;

const SYSTEM_PROMPT = `You are an expert Next.js + Tailwind CSS engineer.
Generate a complete, runnable Next.js App Router project for the user's request.

Rules:
- Use TypeScript (.tsx/.ts files only)
- Use Tailwind CSS for all styling (no separate CSS files besides globals.css)
- Always include app/layout.tsx, app/page.tsx, app/globals.css, and package.json
- Break the UI into components under components/
- Do not use any external UI libraries beyond React and Tailwind
- Return complete file contents, not snippets

CRITICAL OUTPUT FORMAT:
Respond with ONLY a single JSON object matching the required schema.
Do NOT include any prose, explanation, commentary, markdown headers, or
code fences before, after, or around the JSON. Do NOT explain what you are
building or how to run it — the JSON object's "files" array is the entire
response. Any text outside the JSON object will cause a parsing failure.`;

export class OpenRouterAIService implements AIService {
  async generateApplication(
    prompt: string,
    model: ModelProvider,
  ): Promise<GeneratedProject> {
    const resolvedModel = resolveModel(model);
    console.log(`[ai] generateApplication starting (model=${resolvedModel})`);
    try {
      const { object } = await generateObject({
        model: openrouter(resolvedModel),
        schema: generatedProjectSchema,
        system: SYSTEM_PROMPT,
        prompt: `Build this application: ${prompt}`,
        abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
      console.log(`[ai] generateApplication succeeded (${object.files.length} files)`);
      return object;
    } catch (err) {
      console.error(`[ai] generateApplication failed (model=${resolvedModel}):`, err);
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      throw new AppError(
        "LLM_GENERATION_FAILED",
        timedOut
          ? `AI generation timed out after ${GENERATION_TIMEOUT_MS / 1000}s — check OPENROUTER_MODEL is a valid model slug and OPENROUTER_API_KEY is valid`
          : "Failed to generate application",
        502,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async repairApplication(
    files: { path: string; content: string }[],
    buildError: string,
    model: ModelProvider,
  ): Promise<Patch> {
    const resolvedModel = resolveModel(model);
    console.log(`[ai] repairApplication starting (model=${resolvedModel})`);
    try {
      const { object } = await generateObject({
        model: openrouter(resolvedModel),
        schema: patchSchema,
        system: `You are an expert Next.js + Tailwind CSS engineer fixing a broken build.
Return ONLY the files that need to be created, updated, or deleted to fix the error.
Do not return unrelated files. Keep changes minimal and targeted.

CRITICAL OUTPUT FORMAT:
Respond with ONLY a single JSON object matching the required schema.
Do NOT include any prose, explanation, commentary, markdown headers, or
code fences before, after, or around the JSON. Any text outside the JSON
object will cause a parsing failure.`,
        prompt: `Current project files:
${JSON.stringify(files, null, 2)}

Build error:
${buildError}

Return the minimal set of changes needed to fix this build error.`,
        abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
      });
      console.log(`[ai] repairApplication succeeded (${object.changes.length} changes)`);
      return object;
    } catch (err) {
      console.error(`[ai] repairApplication failed (model=${resolvedModel}):`, err);
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      throw new AppError(
        "LLM_REPAIR_FAILED",
        timedOut
          ? `AI repair timed out after ${GENERATION_TIMEOUT_MS / 1000}s`
          : "Failed to repair application",
        502,
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}