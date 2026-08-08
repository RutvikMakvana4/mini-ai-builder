"use client";

import { Button } from "@/components/ui/button";

export function PreviewPanel({ previewUrl }: { previewUrl?: string }) {
  if (!previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-2">
        <p>No preview yet</p>
        <p className="text-xs">Build the project to see a live preview</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b text-xs">
        <span className="text-muted-foreground truncate">{previewUrl}</span>
        <Button size="sm" variant="outline">
          <a href={previewUrl} target="_blank" rel="noreferrer">
            Open Preview
          </a>
        </Button>
      </div>
      <iframe src={previewUrl} className="flex-1 w-full" title="Preview" />
    </div>
  );
}
