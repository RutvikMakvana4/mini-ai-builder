import { z } from "zod";

// Structured output schema — this is what we force the LLM to return.
export const projectFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const generatedProjectSchema = z.object({
  files: z.array(projectFileSchema).min(1),
});

export type GeneratedProject = z.infer<typeof generatedProjectSchema>;

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  prompt: z.string().min(5).max(2000),
  model: z.enum(["claude", "gpt", "gemini"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
