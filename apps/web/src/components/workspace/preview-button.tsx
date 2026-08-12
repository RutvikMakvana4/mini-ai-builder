"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { restartBuild } from "@/lib/api-client";

interface PreviewButtonProps {
  projectId: string;
  buildStatus: string;
  previewUrl?: string;
}

export function PreviewButton({
  projectId,
  buildStatus,
  previewUrl,
}: PreviewButtonProps) {
  const [isRestarting, setIsRestarting] = useState(false);

  const isReady = buildStatus === "READY" && !!previewUrl;

  async function handleRestart() {
    setIsRestarting(true);
    try {
      await restartBuild(projectId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRestarting(false);
    }
  }

  if (!isReady) {
    return (
      <Button variant="outline" disabled>
        Preview unavailable
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
      >
        Open Preview ↗
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Preview sandboxes expire after ~45 min of inactivity — relaunch if the link stops working"
        disabled={isRestarting}
        onClick={handleRestart}
      >
        {isRestarting ? "Relaunching..." : "↻"}
      </Button>
    </div>
  );
}
