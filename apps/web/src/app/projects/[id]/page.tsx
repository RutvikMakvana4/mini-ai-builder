"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileExplorer } from "@/components/workspace/file-explorer";
import { CodeEditor } from "@/components/workspace/code-editor";
import { PreviewPanel } from "@/components/workspace/preview-panel";
import { LogsPanel } from "@/components/workspace/logs-panel";
import { useProjectEvents } from "@/lib/use-project-events";
import { deployProject, updateFile } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 800;

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "destructive" | "warning";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        tone === "success" && "bg-success/15 text-success border-success/30",
        tone === "destructive" &&
          "bg-destructive/15 text-destructive border-destructive/30",
        tone === "warning" && "bg-warning/15 text-warning border-warning/30",
        tone === "neutral" &&
          "bg-muted text-muted-foreground border-border",
      )}
    >
      {label}
    </span>
  );
}

function buildStatusTone(
  status: string,
): "success" | "destructive" | "warning" {
  if (status === "READY") return "success";
  if (status === "BUILD_FAILED" || status === "FAILED") return "destructive";
  return "warning";
}

function generationStatusTone(
  status: string,
): "success" | "destructive" | "warning" {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "destructive";
  return "warning";
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
      <div className="flex items-center justify-center h-screen text-sm font-mono text-muted-foreground terminal-cursor">
        loading
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            ← projects
          </Link>
          <h1 className="font-semibold tracking-tight truncate">
            {project.name}
          </h1>
          {project.generationStatus !== "COMPLETED" && (
            <StatusPill
              label={
                project.generationStatus === "GENERATING"
                  ? "generating"
                  : project.generationStatus.toLowerCase()
              }
              tone={generationStatusTone(project.generationStatus)}
            />
          )}
          <StatusPill
            label={project.buildStatus.toLowerCase()}
            tone={buildStatusTone(project.buildStatus)}
          />
          {project.deploymentStatus !== "IDLE" && (
            <StatusPill
              label={project.deploymentStatus.toLowerCase()}
              tone={
                project.deploymentStatus === "READY" ? "success" : "warning"
              }
            />
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {project.deployUrl && (
            <a
              href={project.deployUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 truncate max-w-[220px] transition-colors"
            >
              {project.deployUrl.replace("https://", "")}
            </a>
          )}
          <button
            type="button"
            disabled={isDeploying || isDeployDisabled(project)}
            onClick={handleDeploy}
            className="rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:bg-primary/85 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {isDeploying || project.deploymentStatus === "DEPLOYING"
              ? "deploying..."
              : project.deploymentStatus === "READY"
                ? "redeploy"
                : "deploy"}
          </button>
        </div>
      </header>

      {/* Main 3-pane workspace */}
      <div className="flex-1 grid grid-cols-[220px_1fr_1fr] min-h-0">
        <FileExplorer
          files={files}
          selectedPath={selectedFile?.path ?? ""}
          onSelect={setSelectedPath}
        />
        <div className="border-r border-border min-h-0 relative">
          <CodeEditor file={selectedFile} onChange={handleFileChange} />
          {selectedFile && savingPaths[selectedFile.path] && (
            <span className="absolute top-2 right-3 font-mono text-[10px] text-muted-foreground">
              saving...
            </span>
          )}
        </div>
        <div className="min-h-0">
          <PreviewPanel previewUrl={project.previewUrl} />
        </div>
      </div>

      {/* Logs */}
      <div className="h-40 border-t border-border">
        <LogsPanel logs={logEvents} />
      </div>
    </div>
  );
}
