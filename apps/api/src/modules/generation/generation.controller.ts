import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { aiService } from "../../services/ai";
import { eventBus } from "../events/event-bus";
import { AppError } from "../../common/errors/app-error";
import { runBuildPipeline } from "../build/build.service";

export async function generateProject(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const projectId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project)
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));

  projectsStore.update(project.id, { generationStatus: "GENERATING" });
  eventBus.emitProjectEvent(project.id, "generation.started");

  // Respond immediately; client tracks progress via SSE
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

    // Automatically move into the build pipeline so sandbox/build/preview
    // happen without requiring a separate manual call from the client.
    if (updated) {
      try {
        await runBuildPipeline(updated);
      } catch (buildErr) {
        eventBus.emitProjectEvent(project.id, "build.failed", {
          message:
            buildErr instanceof Error ? buildErr.message : String(buildErr),
        });
      }
    }
  } catch (err) {
    projectsStore.update(project.id, { generationStatus: "FAILED" });
    eventBus.emitProjectEvent(project.id, "generation.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
