"use client";

import { ProjectFile } from "@/types/project";
import { cn } from "@/lib/utils";

export function FileExplorer({
  files,
  selectedPath,
  onSelect,
}: {
  files: ProjectFile[];
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  return (
    <div className="h-full border-r bg-muted/30 p-3 overflow-y-auto">
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
        Files
      </div>
      <ul className="space-y-1">
        {files.map((file) => (
          <li key={file.path}>
            <button
              onClick={() => onSelect(file.path)}
              className={cn(
                "w-full text-left text-sm px-2 py-1 rounded truncate",
                selectedPath === file.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent",
              )}
            >
              {file.path}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
