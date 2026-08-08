"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { CodeEditor } from "@/components/workspace/code-editor";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { LogsPanel } from "@/components/workspace/logs-panel";
import { useProjectEvents } from "@/lib/use-project-events";

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const { project, logs } = useProjectEvents(params.id);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const files = project?.files ?? [];
  const selectedFile = files.find((f) => f.path === selectedPath) ?? files[0];

  const logEvents = logs.map((l, i) => ({
    id: String(i),
    type: l.type,
    timestamp: l.timestamp,
    message:
      (l.data?.log as string) ||
      (l.data?.message as string) ||
      (l.data?.changedFiles ? `Changed: ${(l.data.changedFiles as string[]).join(", ")}` : l.type),
  }));

  if (!project) {
    return <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">{project.name}</h1>
          <Badge variant={project.buildStatus === "READY" ? "default" : "secondary"}>
            {project.buildStatus}
          </Badge>
        </div>
        <Button disabled={project.buildStatus !== "READY"}>Deploy</Button>
      </header>

      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] min-h-0">
        <FileExplorer
          files={files}
          selectedPath={selectedFile?.path ?? ""}
          onSelect={setSelectedPath}
        />
        <div className="border-r min-h-0">
          <CodeEditor file={selectedFile} />
        </div>
        <div className="min-h-0">
          <PreviewPanel previewUrl={project.previewUrl} />
        </div>
      </div>

      <div className="h-40 border-t">
        <LogsPanel logs={logEvents} />
      </div>
    </div>
  );
}