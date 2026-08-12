import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { runBuildPipeline } from "./build.service";
import { sandboxService } from "../../services/sandbox/sandbox-service";
import { eventBus } from "../events/event-bus";
import { AppError } from "../../common/errors/app-error";
import { ProjectParams } from "../../common/types/http";

export async function triggerBuild(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  const project = projectsStore.findById(req.params.id);
  if (!project)
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  if (project.files.length === 0) {
    return next(
      new AppError("NO_FILES", "Generate the project before building", 400),
    );
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

export async function restartBuild(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  const project = projectsStore.findById(req.params.id);
  if (!project)
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  if (project.files.length === 0) {
    return next(
      new AppError("NO_FILES", "Generate the project before building", 400),
    );
  }

  if (project.sandboxId) {
    try {
      await sandboxService.destroy(project.sandboxId);
    } catch {
      // sandbox already gone; nothing to clean up
    }
  }

  const reset = projectsStore.update(project.id, {
    sandboxId: undefined,
    previewUrl: undefined,
    buildStatus: "NOT_STARTED",
    repairAttempts: 0,
  });

  res.status(202).json({ project: reset });

  try {
    await runBuildPipeline(reset!);
  } catch (err) {
    eventBus.emitProjectEvent(project.id, "build.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
