import { z } from "zod";

export const projectFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .refine(
      (p) => p === "app/page.tsx" || p.startsWith("components/"),
      "Path must be app/page.tsx or under components/",
    ),
  content: z
    .string()
    .min(30, "File content must be real, complete code — not a placeholder"),
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
