import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { AIService } from "./ai-service";
import {
  generatedProjectSchema,
  GeneratedProject,
} from "../../common/validation/generation";
import { AppError } from "../../common/errors/app-error";
import { patchSchema, Patch } from "../../common/validation/repair";

const SYSTEM_PROMPT = `You are an expert Next.js + Tailwind CSS engineer.
Generate a complete, runnable Next.js App Router project for the user's request.

Rules:
- Use TypeScript (.tsx/.ts files only)
- Use Tailwind CSS for all styling (no separate CSS files besides globals.css)
- Always include app/layout.tsx, app/page.tsx, app/globals.css, and package.json
- Break the UI into components under components/
- Do not use any external UI libraries beyond React and Tailwind
- Return complete file contents, not snippets`;

export class AnthropicAIService implements AIService {
  async generateApplication(prompt: string): Promise<GeneratedProject> {
    try {
      const { object } = await generateObject({
        model: anthropic("claude-sonnet-5"),
        schema: generatedProjectSchema,
        system: SYSTEM_PROMPT,
        prompt: `Build this application: ${prompt}`,
      });
      return object;
    } catch (err) {
      throw new AppError(
        "LLM_GENERATION_FAILED",
        "Failed to generate application",
        502,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  async repairApplication(
    files: { path: string; content: string }[],
    buildError: string,
  ): Promise<Patch> {
    try {
      const { object } = await generateObject({
        model: anthropic("claude-sonnet-5"),
        schema: patchSchema,
        system: `You are an expert Next.js + Tailwind CSS engineer fixing a broken build.
Return ONLY the files that need to be created, updated, or deleted to fix the error.
Do not return unrelated files. Keep changes minimal and targeted.`,
        prompt: `Current project files:
${JSON.stringify(files, null, 2)}

Build error:
${buildError}

Return the minimal set of changes needed to fix this build error.`,
      });
      return object;
    } catch (err) {
      throw new AppError(
        "LLM_REPAIR_FAILED",
        "Failed to repair application",
        502,
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
