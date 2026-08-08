"use client";

import { useEffect, useRef, useState } from "react";
import { Project } from "@/types/project";

interface ProjectEvent {
  type: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useProjectEvents(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<ProjectEvent[]>([]);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLogs([]);
      return;
    }

    const source = new EventSource(`${API_URL}/api/projects/${projectId}/events`);
    sourceRef.current = source;

    const handle = (raw: MessageEvent) => {
      const event: ProjectEvent = JSON.parse(raw.data);
      setLogs((prev) => [...prev, event]);

      const eventProject = event.data?.project as Project | undefined;
      if (eventProject) setProject(eventProject);
    };

    // Named events all funnel through the same handler
    const eventTypes = [
      "snapshot",
      "generation.started",
      "generation.completed",
      "generation.failed",
      "sandbox.created",
      "build.started",
      "build.log",
      "build.completed",
      "build.failed",
      "repair.started",
      "repair.completed",
      "preview.ready",
    ];
    eventTypes.forEach((type) => source.addEventListener(type, handle as EventListener));

    source.onerror = () => {
      // EventSource auto-reconnects; nothing to do here for now
    };

    return () => {
      eventTypes.forEach((type) => source.removeEventListener(type, handle as EventListener));
      source.close();
    };
  }, [projectId]);

  return { project, logs };
}