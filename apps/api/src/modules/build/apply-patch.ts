import { ProjectFile } from "../../common/types/project";
import { Patch } from "../../common/validation/repair";

export function applyPatch(files: ProjectFile[], patch: Patch): ProjectFile[] {
  const byPath = new Map(files.map((f) => [f.path, f]));

  for (const change of patch.changes) {
    if (change.operation === "delete") {
      byPath.delete(change.path);
    } else {
      byPath.set(change.path, { path: change.path, content: change.content ?? "" });
    }
  }

  return Array.from(byPath.values());
}