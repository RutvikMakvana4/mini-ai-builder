"use client";

export function PreviewPanel({ previewUrl }: { previewUrl?: string }) {
  if (!previewUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground gap-1 grain-surface">
        <p>no preview yet</p>
        <p className="text-xs font-mono">
          build the project to see it live
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-sidebar">
        <div className="flex gap-1.5 shrink-0">
          <span className="size-2 rounded-full bg-destructive/60" />
          <span className="size-2 rounded-full bg-warning/60" />
          <span className="size-2 rounded-full bg-success/60" />
        </div>
        <span className="flex-1 truncate rounded-md bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          {previewUrl}
        </span>
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          open ↗
        </a>
      </div>
      <iframe src={previewUrl} className="flex-1 w-full bg-white" title="Preview" />
    </div>
  );
}
