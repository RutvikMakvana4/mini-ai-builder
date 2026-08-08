import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { runBuildPipeline } from "./build.service";
import { eventBus } from "../events/event-bus";
import { AppError } from "../../common/errors/app-error";

export async function triggerBuild(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  if (project.files.length === 0) {
    return next(new AppError("NO_FILES", "Generate the project before building", 400));
  }

  res.status(202).json({ project });

  try {
    await runBuildPipeline(project);
  } catch (err) {
    eventBus.emitProjectEvent(project.id, "build.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}