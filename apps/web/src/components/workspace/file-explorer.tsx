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
    <div className="h-full border-r border-border bg-sidebar p-3 overflow-y-auto">
      <div className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
        files
      </div>
      <ul className="space-y-0.5">
        {files.map((file) => (
          <li key={file.path}>
            <button
              onClick={() => onSelect(file.path)}
              className={cn(
                "w-full text-left font-mono text-xs px-2 py-1.5 rounded-md truncate transition-colors",
                selectedPath === file.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
