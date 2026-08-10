import { generateObject, NoObjectGeneratedError } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { AIService } from "./ai-service";
import {
  generatedProjectSchema,
  GeneratedProject,
} from "../../common/validation/generation";
import { patchSchema, Patch } from "../../common/validation/repair";
import { AppError } from "../../common/errors/app-error";
import { sanitizeGeneratedContent } from "./sanitize-content";
import { ModelProvider } from "../../common/types/project";
import { getStaticFiles } from "./project-template";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const PRIMARY_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

const FALLBACK_MODELS = (
  process.env.OPENROUTER_FALLBACK_MODELS || "openrouter/free"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// OpenRouter's `models` fallback array is capped at 3 entries per request.
const MODEL_CHAIN = [
  PRIMARY_MODEL,
  ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL),
].slice(0, 3);

const OUTER_SWEEPS = 3; // if the whole chain fails, try the whole chain again once more
const GENERATION_MAX_OUTPUT_TOKENS = 6000;
const REPAIR_MAX_OUTPUT_TOKENS = 3000;
const REQUEST_TIMEOUT_MS = 240_000; // generous — OpenRouter is trying multiple models internally

const SYSTEM_PROMPT = `You are an expert Next.js + Tailwind CSS engineer.

The project scaffolding (package.json, tsconfig.json, next.config.js, tailwind config, app/layout.tsx, app/globals.css) already exists and is fixed — you do NOT write those files.

Your ONLY job is to write:
- app/page.tsx (required, the main page)
- components/*.tsx (optional, only if the page genuinely needs reusable pieces)

Rules:
- Use TypeScript (.tsx only)
- Use Tailwind CSS utility classes for all styling
- app/layout.tsx already wraps your page in <html>/<body> — do not redeclare them
- Write the ENTIRE page as ONE self-contained app/page.tsx file with inline sections (e.g. a Hero, Features, Testimonials block all in the same file). Do NOT create separate component files — this must fit in a limited output budget
- Keep the design clean but concise: 3-4 sections is enough, don't over-engineer
- File content must be plain text, NEVER wrapped in markdown code fences (no \`\`\`)
- Every statement MUST be on its own line. Never write two statements (e.g. two import lines) on the same physical line — always put a real newline character after each import/export statement
- Return complete, real, working code — never placeholders like "{}" or "// TODO"
- Finish what you start: never leave a file half-written or a string unterminated. If you are running low on space, write a SHORTER page rather than an incomplete one
- JSX comments must be written exactly as {/* comment text */} — always close with */} , never */) or any other combination
- Always use className, never class, for CSS classes (this is JSX/React, not plain HTML)
`;

const REPAIR_SYSTEM_PROMPT = `You are an expert Next.js + Tailwind CSS engineer fixing a broken build.
You may only modify app/page.tsx or files under components/ — the project scaffolding is fixed and off-limits.
Return ONLY the files that need to be created, updated, or deleted to fix the error.

CRITICAL: For every file you update, you MUST return its ENTIRE content from the first character to the last — the full file, not a diff or excerpt.
NEVER write elision comments like "// ... rest of file unchanged", "// ... (remains the same)", or "// rest omitted". There is no "original" for the system to merge against — whatever content you return REPLACES the file completely. If you omit part of the file, that part is DELETED.

File content must be plain text, NEVER wrapped in markdown code fences.
Every statement MUST be on its own line — never concatenate multiple statements onto one line.
Keep the actual CHANGE minimal, but always output the complete file around that change.
Finish what you start: never leave a file half-written or a string unterminated.`;

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
    const totalAttempts = OUTER_SWEEPS * MODEL_CHAIN.length;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const primaryModel = MODEL_CHAIN[attempt % MODEL_CHAIN.length];
      // Still hand OpenRouter the full chain as its own server-side fallback,
      // in case this specific call fails outright (rate limit, 5xx, timeout).
      // We no longer rely on that alone though, since a "successful but bad"
      // (e.g. truncated) response never triggers OpenRouter's internal fallback.
      const fallbackChain = [
        primaryModel,
        ...MODEL_CHAIN.filter((m) => m !== primaryModel),
      ].slice(0, 3);

      try {
        console.log(
          `[ai] generateApplication attempt ${attempt + 1}/${totalAttempts} (model=${primaryModel})`,
        );

        const { object, finishReason } = await generateObject({
          model: openrouter(primaryModel, {
            plugins: [{ id: "response-healing" }],
          }),
          schema: generatedProjectSchema,
          system: SYSTEM_PROMPT,
          maxOutputTokens: GENERATION_MAX_OUTPUT_TOKENS,
          prompt: lastError
            ? `Build this application: ${prompt}

Your previous attempt failed with this error, fix it: ${lastError}`
            : `Build this application: ${prompt}`,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          providerOptions: {
            openrouter: {
              models: fallbackChain,
              reasoning: { max_tokens: 0 },
            },
          },
        });

        if (finishReason === "length") {
          throw new Error(
            "Generation was cut off before finishing (hit the token limit) — output is incomplete",
          );
        }

        const aiFiles = this.sanitizeFiles(object.files);
        console.log(
          `[ai] raw response: ${aiFiles.length} file(s), lengths: ${aiFiles
            .map((f) => `${f.path}=${f.content?.length ?? 0}chars`)
            .join(", ")}`,
        );
        this.assertCompleteFiles(aiFiles);

        const staticFiles = getStaticFiles(prompt.slice(0, 50));
        const files = [...staticFiles, ...aiFiles];

        console.log(
          `[ai] generateApplication succeeded on attempt ${attempt + 1} (model=${primaryModel}, ${aiFiles.length} AI files + ${staticFiles.length} static files)`,
        );
        return { files };
      } catch (err) {
        lastError = this.describeError(err);
        console.warn(
          `[ai] generateApplication attempt ${attempt + 1} failed (model=${primaryModel}): ${lastError}`,
        );
      }
    }

    throw new AppError(
      "LLM_GENERATION_FAILED",
      "Failed to generate application after trying all available free models",
      502,
      lastError,
    );
  }

  async repairApplication(
    files: { path: string; content: string }[],
    buildError: string,
    _model?: ModelProvider,
  ): Promise<Patch> {
    let lastError: string | undefined;
    const totalAttempts = OUTER_SWEEPS * MODEL_CHAIN.length;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      const primaryModel = MODEL_CHAIN[attempt % MODEL_CHAIN.length];
      const fallbackChain = [
        primaryModel,
        ...MODEL_CHAIN.filter((m) => m !== primaryModel),
      ].slice(0, 3);

      try {
        console.log(
          `[ai] repairApplication attempt ${attempt + 1}/${totalAttempts} (model=${primaryModel})`,
        );

        const { object, finishReason } = await generateObject({
          model: openrouter(primaryModel, {
            plugins: [{ id: "response-healing" }],
          }),
          schema: patchSchema,
          system: REPAIR_SYSTEM_PROMPT,
          maxOutputTokens: REPAIR_MAX_OUTPUT_TOKENS,
          prompt: `Current project files:
${JSON.stringify(files, null, 2)}

Build error:
${buildError}
${lastError ? `\nYour previous repair attempt failed with: ${lastError}` : ""}

Return the minimal set of changes needed to fix this build error.`,
          abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          providerOptions: {
            openrouter: {
              models: fallbackChain,
              reasoning: { max_tokens: 0 },
            },
          },
        });

        if (finishReason === "length") {
          throw new Error(
            "Repair output was cut off before finishing (hit the token limit)",
          );
        }

        const changes = this.sanitizeFiles(object.changes);
        const changesWithContent = changes.filter(
          (
            c,
          ): c is {
            path: string;
            content: string;
            operation: "create" | "update" | "delete";
          } => c.content !== undefined,
        );
        this.assertCompleteFiles(
          changesWithContent.map((c) => ({ path: c.path, content: c.content })),
        );

        if (changes.length === 0) {
          throw new Error("Repair returned no changes");
        }

        console.log(
          `[ai] repairApplication succeeded on attempt ${attempt + 1} (model=${primaryModel}, ${changes.length} changes)`,
        );
        return { changes };
      } catch (err) {
        lastError = this.describeError(err);
        console.warn(
          `[ai] repairApplication attempt ${attempt + 1} failed (model=${primaryModel}): ${lastError}`,
        );
      }
    }

    throw new AppError(
      "LLM_REPAIR_FAILED",
      "Failed to repair application after trying all available free models",
      502,
      lastError,
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

  private assertCompleteFiles(files: { path: string; content: string }[]) {
    const elisionPattern = /\/\/\s*\.{3}.*(unchanged|remains|omitted|rest of)/i;

    for (const file of files) {
      if (elisionPattern.test(file.content)) {
        console.error(
          `[ai] ELIDED CONTENT for ${file.path}:\n---\n${file.content}\n---`,
        );
        throw new Error(
          `${file.path} contains an elision comment (e.g. "...rest unchanged") instead of full file content — the model returned a diff, not the complete file`,
        );
      }

      const opens = (file.content.match(/{/g) || []).length;
      const closes = (file.content.match(/}/g) || []).length;

      if (opens !== closes) {
        console.error(
          `[ai] TRUNCATED CONTENT for ${file.path} (${file.content.length} chars):\n---\n${file.content}\n---`,
        );
        throw new Error(
          `${file.path} looks truncated — unbalanced braces (${opens} open, ${closes} close)`,
        );
      }

      if (
        file.path === "app/page.tsx" &&
        !/export default/.test(file.content)
      ) {
        console.error(
          `[ai] INCOMPLETE CONTENT for ${file.path} (${file.content.length} chars):\n---\n${file.content}\n---`,
        );
        throw new Error(
          `${file.path} is missing "export default" — looks incomplete`,
        );
      }
    }
  }

  private describeError(err: unknown): string {
    if (NoObjectGeneratedError.isInstance(err)) {
      const raw = err.text ?? "(no raw text captured)";
      console.error(
        "[ai] raw model output that failed to parse:\n",
        raw.slice(0, 2000),
      );
      return `Model returned invalid/unparseable output: ${err.message}`;
    }
    return err instanceof Error ? err.message : String(err);
  }
}
