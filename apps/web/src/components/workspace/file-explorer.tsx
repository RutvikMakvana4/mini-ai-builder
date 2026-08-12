"use client";

import { ProjectFile } from "@/types/project";
import { cn } from "@/lib/utils";
import { StatusBanner } from "./status-banner";

export function FileExplorer({
  files,
  selectedPath,
  onSelect,
  generationStatus,
  buildStatus,
}: {
  files: ProjectFile[];
  selectedPath: string;
  onSelect: (path: string) => void;
  generationStatus: string;
  buildStatus: string;
}) {
  return (
    <div className="h-full border-r bg-muted/30 flex flex-col">
      <StatusBanner
        generationStatus={generationStatus}
        buildStatus={buildStatus}
      />
      <div className="p-3 overflow-y-auto flex-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          Files
        </div>
        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No files yet</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
