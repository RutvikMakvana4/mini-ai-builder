import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { deploymentService } from "../../services/deployment/deployment-service";
import { eventBus } from "../events/event-bus";
import { AppError } from "../../common/errors/app-error";

export async function deployProject(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  if (project.buildStatus !== "READY") {
    return next(new AppError("PROJECT_NOT_BUILT", "Build the project before deploying", 400));
  }

  projectsStore.update(project.id, { deploymentStatus: "QUEUED" });
  eventBus.emitProjectEvent(project.id, "deployment.started");

  res.status(202).json({ project: projectsStore.findById(project.id) });

  try {
    const slug = project.name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 50);

    const result = await deploymentService.deployAndWait(slug, project.files, (progress) => {
      projectsStore.update(project.id, { deploymentStatus: progress.status });
      eventBus.emitProjectEvent(project.id, `deployment.${progress.status.toLowerCase()}`, {
        deploymentId: progress.deploymentId,
        url: progress.url,
      });
    });

    if (result.status === "READY") {
      const updated = projectsStore.update(project.id, {
        deploymentStatus: "READY",
        deployUrl: result.url,
        deployError: undefined,
      });
      eventBus.emitProjectEvent(project.id, "deployment.completed", {
        url: result.url,
        project: updated,
      });
    } else {
      projectsStore.update(project.id, { deploymentStatus: "FAILED", deployError: "Deployment failed or timed out" });
      eventBus.emitProjectEvent(project.id, "deployment.failed", {
        message: "Deployment failed or timed out",
      });
    }
  } catch (err) {
    projectsStore.update(project.id, { deploymentStatus: "FAILED" });
    eventBus.emitProjectEvent(project.id, "deployment.failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}