import { z } from "zod";

export const patchOperationSchema = z.object({
  path: z.string().min(1),
  operation: z.enum(["create", "update", "delete"]),
  content: z.string().optional(), // omitted for "delete"
});

export const patchSchema = z.object({
  changes: z.array(patchOperationSchema).min(1),
});

export type Patch = z.infer<typeof patchSchema>;
