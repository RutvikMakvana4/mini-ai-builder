"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { CodeEditor } from "@/components/workspace/code-editor";
import { PreviewButton } from "@/components/workspace/preview-button";
import { LogsPanel } from "@/components/workspace/logs-panel";
import { useProjectEvents } from "@/lib/use-project-events";
import { deployProject } from "@/lib/api-client";
import { use } from "react";

function buildStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "READY") return "default";
  if (status === "BUILD_FAILED") return "destructive";
  return "secondary";
}

function isDeployDisabled(project: {
  buildStatus: string;
  deploymentStatus: string;
}) {
  const deploying =
    project.deploymentStatus === "QUEUED" ||
    project.deploymentStatus === "BUILDING" ||
    project.deploymentStatus === "DEPLOYING";
  return project.buildStatus !== "READY" || deploying;
}

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { project, logs } = useProjectEvents(id);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  const files = project.files ?? [];
  const selectedFile = files.find((f) => f.path === selectedPath) ?? files[0];

  const logEvents = logs.map((l, i) => ({
    id: String(i),
    type: l.type,
    timestamp: l.timestamp,
    message:
      (l.data?.log as string) ||
      (l.data?.message as string) ||
      (l.data?.changedFiles
        ? `Changed: ${(l.data.changedFiles as string[]).join(", ")}`
        : l.type),
  }));

  async function handleDeploy() {
    setIsDeploying(true);
    try {
      await deployProject(project!.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeploying(false);
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-semibold truncate">{project.name}</h1>
          <Badge variant={buildStatusVariant(project.buildStatus)}>
            {project.buildStatus}
          </Badge>
          {project.deploymentStatus !== "IDLE" && (
            <Badge
              variant={
                project.deploymentStatus === "READY" ? "default" : "secondary"
              }
            >
              {project.deploymentStatus}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {project.deployUrl && (
            <a
              href={project.deployUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline truncate max-w-[180px]"
            >
              {project.deployUrl}
            </a>
          )}
          <PreviewButton
            projectId={project.id}
            buildStatus={project.buildStatus}
            previewUrl={project.previewUrl}
          />
          <Button
            disabled={isDeploying || isDeployDisabled(project)}
            onClick={handleDeploy}
          >
            {isDeploying || project.deploymentStatus === "DEPLOYING"
              ? "Deploying..."
              : project.deploymentStatus === "READY"
                ? "Redeploy"
                : "Deploy"}
          </Button>
        </div>
      </header>

      {/* Main 2-pane workspace */}
      <div className="flex-1 grid grid-cols-[240px_1fr] min-h-0">
        <FileExplorer
          files={files}
          selectedPath={selectedFile?.path ?? ""}
          onSelect={setSelectedPath}
          generationStatus={project.generationStatus}
          buildStatus={project.buildStatus}
        />
        <div className="min-h-0">
          <CodeEditor file={selectedFile} />
        </div>
      </div>

      {/* Collapsible logs */}
      <div className={cnLogsHeight(logsOpen)}>
        <button
          onClick={() => setLogsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium bg-muted/50 border-t"
        >
          <span>Build Logs</span>
          <span>{logsOpen ? "Hide ▾" : "Show ▴"}</span>
        </button>
        {logsOpen && (
          <div className="h-40">
            <LogsPanel logs={logEvents} />
          </div>
        )}
      </div>
    </div>
  );
}

function cnLogsHeight(open: boolean) {
  return open ? "shrink-0" : "shrink-0";
}
