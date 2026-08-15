import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { aiService } from "../../services/ai";
import { eventBus } from "../events/event-bus";
import { AppError } from "../../common/errors/app-error";
import { ProjectParams } from "../../common/types/http";
import { runBuildPipeline } from "../build/build.service";

export async function generateProject(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  const project = projectsStore.findById(req.params.id);
  if (!project)
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));

  projectsStore.update(project.id, { generationStatus: "GENERATING" });
  eventBus.emitProjectEvent(project.id, "generation.started");

  res.status(202).json({ project: projectsStore.findById(project.id) });

  try {
    const result = await aiService.generateApplication(
      project.prompt,
      project.model,
    );
    const updated = projectsStore.update(project.id, {
      generationStatus: "COMPLETED",
      files: result.files,
    });
    eventBus.emitProjectEvent(project.id, "generation.completed", {
      fileCount: result.files.length,
      project: updated,
    });

    // Generation succeeded — automatically kick off the build pipeline so the
    // user doesn't have to manually trigger a separate /build request.
    try {
      await runBuildPipeline(updated!);
    } catch (buildErr) {
      eventBus.emitProjectEvent(project.id, "build.failed", {
        message:
          buildErr instanceof Error ? buildErr.message : String(buildErr),
      });
    }
  } catch (err) {
    projectsStore.update(project.id, { generationStatus: "FAILED" });
    eventBus.emitProjectEvent(project.id, "generation.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
