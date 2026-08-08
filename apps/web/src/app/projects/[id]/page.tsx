"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { CodeEditor } from "@/components/workspace/code-editor";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { LogsPanel } from "@/components/workspace/logs-panel";
import { useProjectEvents } from "@/lib/use-project-events";
import { deployProject, updateFile } from "@/lib/api-client";

const SAVE_DEBOUNCE_MS = 800;

function buildStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "READY") return "default";
  if (status === "BUILD_FAILED") return "destructive";
  return "secondary";
}

function generationStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "COMPLETED") return "default";
  if (status === "FAILED") return "destructive";
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

export default function WorkspacePage() {
  const params = useParams<{ id?: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { project, logs } = useProjectEvents(projectId ?? "");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  // Local overrides for in-progress edits, keyed by file path. Lets typing
  // feel instant while saves to the backend happen debounced in the background.
  const [editedFiles, setEditedFiles] = useState<Record<string, string>>({});
  const [savingPaths, setSavingPaths] = useState<Record<string, boolean>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    // Clear pending timers on unmount
    const timers = saveTimers.current;
    return () => {
      Object.values(timers).forEach((t) => clearTimeout(t));
    };
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  const files = (project.files ?? []).map((file) =>
    editedFiles[file.path] !== undefined
      ? { ...file, content: editedFiles[file.path] }
      : file,
  );
  const selectedFile =
    files.find((file) => file.path === selectedPath) ?? files[0];

  function handleFileChange(path: string, content: string) {
    setEditedFiles((prev) => ({ ...prev, [path]: content }));

    if (saveTimers.current[path]) clearTimeout(saveTimers.current[path]);
    saveTimers.current[path] = setTimeout(async () => {
      setSavingPaths((prev) => ({ ...prev, [path]: true }));
      try {
        await updateFile(project!.id, path, content);
      } catch (err) {
        console.error(err);
      } finally {
        setSavingPaths((prev) => ({ ...prev, [path]: false }));
      }
    }, SAVE_DEBOUNCE_MS);
  }

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
      // Live status updates arrive via SSE (deployment.* events)
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
        <div className="flex items-center gap-3">
          <h1 className="font-semibold">{project.name}</h1>
          {project.generationStatus !== "COMPLETED" && (
            <Badge variant={generationStatusVariant(project.generationStatus)}>
              {project.generationStatus === "GENERATING"
                ? "Generating..."
                : project.generationStatus}
            </Badge>
          )}
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

        <div className="flex items-center gap-3">
          {project.deployUrl && (
            <a
              href={project.deployUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline truncate max-w-[220px]"
            >
              {project.deployUrl}
            </a>
          )}
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

      {/* Main 3-pane workspace */}
      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] min-h-0">
        <FileExplorer
          files={files}
          selectedPath={selectedFile?.path ?? ""}
          onSelect={setSelectedPath}
        />
        <div className="border-r min-h-0 relative">
          <CodeEditor file={selectedFile} onChange={handleFileChange} />
          {selectedFile && savingPaths[selectedFile.path] && (
            <span className="absolute top-2 right-3 text-xs text-muted-foreground">
              Saving...
            </span>
          )}
        </div>
        <div className="min-h-0">
          <PreviewPanel previewUrl={project.previewUrl} />
        </div>
      </div>

      {/* Logs */}
      <div className="h-40 border-t">
        <LogsPanel logs={logEvents} />
      </div>
    </div>
  );
}
