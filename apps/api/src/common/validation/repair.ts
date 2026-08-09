import { z } from "zod";

export const patchOperationSchema = z.object({
  path: z.string().min(1),
  operation: z.enum(["create", "update", "delete"]),
  content: z
    .string()
    .min(30, "File content must be real, complete code — not a placeholder")
    .optional(),
});

export const patchSchema = z.object({
  changes: z.array(patchOperationSchema).min(1),
});

export type Patch = z.infer<typeof patchSchema>;
