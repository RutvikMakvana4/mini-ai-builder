import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { sandboxService } from "../../services/sandbox/sandbox-service";
import { AppError } from "../../common/errors/app-error";

export async function createSandbox(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  if (project.files.length === 0) {
    return next(new AppError("NO_FILES", "Generate the project before creating a sandbox", 400));
  }

  try {
    projectsStore.update(project.id, { sandboxStatus: "CREATING" });
    const handle = await sandboxService.create(project.id);
    await sandboxService.writeFiles(handle.id, project.files);
    const updated = projectsStore.update(project.id, {
      sandboxId: handle.id,
      sandboxStatus: "READY",
      previewUrl: handle.previewUrl,
    });

    res.status(201).json({ project: updated });
  } catch (err) {
    projectsStore.update(project.id, { sandboxStatus: "FAILED" });
    next(err);
  }
}

export async function destroySandbox(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  if (!project.sandboxId) return next(new AppError("NO_SANDBOX", "No active sandbox", 400));

  try {
    await sandboxService.destroy(project.sandboxId);
    const updated = projectsStore.update(project.id, {
      sandboxStatus: "STOPPED",
      previewUrl: undefined,
    });
    res.json({ project: updated });
  } catch (err) {
    next(err);
  }
}