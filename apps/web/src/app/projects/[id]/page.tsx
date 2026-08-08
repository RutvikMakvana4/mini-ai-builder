"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { CodeEditor } from "@/components/workspace/code-editor";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { LogsPanel } from "@/components/workspace/logs-panel";
import { mockFiles, mockLogs, mockProjects } from "@/lib/mock-data";

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const project = mockProjects.find((p) => p.id === params.id) ?? mockProjects[0];
  const [selectedPath, setSelectedPath] = useState(mockFiles[0].path);
  const selectedFile = mockFiles.find((f) => f.path === selectedPath);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">{project.name}</h1>
          <Badge variant="secondary">{project.buildStatus}</Badge>
        </div>
        <Button disabled={project.buildStatus !== "READY"}>Deploy</Button>
      </header>

      {/* Main 3-pane workspace */}
      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] min-h-0">
        <FileExplorer files={mockFiles} selectedPath={selectedPath} onSelect={setSelectedPath} />
        <div className="border-r min-h-0">
          <CodeEditor file={selectedFile} />
        </div>
        <div className="min-h-0">
          <PreviewPanel previewUrl={project.previewUrl} />
        </div>
      </div>

      {/* Logs */}
      <div className="h-40 border-t">
        <LogsPanel logs={mockLogs} />
      </div>
    </div>
  );
}