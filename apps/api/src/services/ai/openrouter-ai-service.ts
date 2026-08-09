import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { AIService } from "./ai-service";
import {
  generatedProjectSchema,
  GeneratedProject,
} from "../../common/validation/generation";
import { patchSchema, Patch } from "../../common/validation/repair";
import { AppError } from "../../common/errors/app-error";
import { stripCodeFences } from "./sanitize-content";
import { getStaticFiles, PROTECTED_PATHS } from "./project-template";
import { ModelProvider } from "../../common/types/project";
import { sanitizeGeneratedContent } from "./sanitize-content";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 120_000;

const SYSTEM_PROMPT = `You are an expert Next.js + Tailwind CSS engineer.

The project scaffolding (package.json, tsconfig.json, next.config.js, tailwind config, app/layout.tsx, app/globals.css) already exists and is fixed — you do NOT write those files.

Your ONLY job is to write:
- app/page.tsx (required, the main page)
- components/*.tsx (optional, any components you want to split out)

Rules:
- Use TypeScript (.tsx only)
- Use Tailwind CSS utility classes for all styling
- app/layout.tsx already wraps your page in <html>/<body> — do not redeclare them
- File content must be plain text, NEVER wrapped in markdown code fences (no \`\`\`)
- Every statement MUST be on its own line. Never write two statements (e.g. two import lines, or an import and an export) on the same physical line — always put a real newline character after each import/export statement
- Return complete, real, working code — never placeholders like "{}" or "// TODO"`;

const REPAIR_SYSTEM_PROMPT = `You are an expert Next.js + Tailwind CSS engineer fixing a broken build.
You may only modify app/page.tsx or files under components/ — the project scaffolding is fixed and off-limits.
Return ONLY the files that need to be created, updated, or deleted to fix the error.
File content must be plain text, NEVER wrapped in markdown code fences.
Every statement MUST be on its own line — never concatenate multiple statements onto one line.
Keep changes minimal and targeted.`;

interface FileLike {
  path: string;
  content?: string;
}

export class OpenRouterAIService implements AIService {
  async generateApplication(
    prompt: string,
    _model?: ModelProvider,
  ): Promise<GeneratedProject> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(
          `[ai] generateApplication attempt ${attempt}/${MAX_ATTEMPTS} (model=${MODEL})`,
        );

        const { object } = await generateObject({
          model: openrouter(MODEL),
          schema: generatedProjectSchema,
          system: SYSTEM_PROMPT,
          prompt: lastError
            ? `Build this application: ${prompt}

Your previous attempt failed with this error, fix it: ${lastError}`
            : `Build this application: ${prompt}`,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        const aiFiles = this.sanitizeFiles(object.files);
        const staticFiles = getStaticFiles(prompt.slice(0, 50));
        const files = [...staticFiles, ...aiFiles];

        console.log(
          `[ai] generateApplication succeeded on attempt ${attempt} (${aiFiles.length} AI files + ${staticFiles.length} static files)`,
        );
        return { files };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(
          `[ai] generateApplication attempt ${attempt} failed: ${lastError}`,
        );

        if (attempt === MAX_ATTEMPTS) {
          throw new AppError(
            "LLM_GENERATION_FAILED",
            "Failed to generate application after multiple attempts",
            502,
            lastError,
          );
        }
      }
    }

    throw new AppError(
      "LLM_GENERATION_FAILED",
      "Failed to generate application",
      502,
    );
  }

  async repairApplication(
    files: { path: string; content: string }[],
    buildError: string,
    _model?: ModelProvider,
  ): Promise<Patch> {
    // Only expose AI-owned files to the repair model — it can't fix what it can't see,
    // and this keeps it from trying (and failing) to touch protected scaffolding.
    const editableFiles = files.filter((f) => !PROTECTED_PATHS.has(f.path));
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(
          `[ai] repairApplication attempt ${attempt}/${MAX_ATTEMPTS} (model=${MODEL})`,
        );

        const { object } = await generateObject({
          model: openrouter(MODEL),
          schema: patchSchema,
          system: REPAIR_SYSTEM_PROMPT,
          prompt: `Editable project files:
${JSON.stringify(editableFiles, null, 2)}

Build error:
${buildError}
${lastError ? `\nYour previous repair attempt failed with: ${lastError}` : ""}

Return the minimal set of changes needed to fix this build error.`,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        // Defense in depth: drop any change that targets a protected path,
        // even if the model ignored the instruction.
        const changes = this.sanitizeFiles(object.changes).filter(
          (c) => !PROTECTED_PATHS.has(c.path),
        );

        if (changes.length === 0) {
          throw new Error("Repair returned no valid changes to editable files");
        }

        console.log(
          `[ai] repairApplication succeeded on attempt ${attempt} (${changes.length} changes)`,
        );
        return { changes };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.warn(
          `[ai] repairApplication attempt ${attempt} failed: ${lastError}`,
        );

        if (attempt === MAX_ATTEMPTS) {
          throw new AppError(
            "LLM_REPAIR_FAILED",
            "Failed to repair application after multiple attempts",
            502,
            lastError,
          );
        }
      }
    }

    throw new AppError(
      "LLM_REPAIR_FAILED",
      "Failed to repair application",
      502,
    );
  }

  private sanitizeFiles<T extends FileLike>(files: T[]): T[] {
    return files.map((f) => ({
      ...f,
      content:
        f.content !== undefined
          ? sanitizeGeneratedContent(f.content)
          : f.content,
    }));
  }
}
