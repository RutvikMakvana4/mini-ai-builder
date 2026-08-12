import { Request, Response } from "express";
import { eventBus, ProjectEvent } from "./event-bus";
import { projectsStore } from "../projects/projects.store";
import { ProjectParams } from "../../common/types/http";

export function streamEvents(req: Request<ProjectParams>, res: Response) {
  const projectId = req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project) {
    res
      .status(404)
      .json({
        error: { code: "PROJECT_NOT_FOUND", message: "Project not found" },
      });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const send = (event: ProjectEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  send({
    type: "snapshot",
    timestamp: new Date().toISOString(),
    data: { project },
  });

  const unsubscribe = eventBus.subscribe(projectId, send);

  const heartbeat = setInterval(() => res.write(": ping\n\n"), 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
}
