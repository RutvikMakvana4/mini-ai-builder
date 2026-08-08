import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { aiService } from "../../services/ai";
import { AppError } from "../../common/errors/app-error";

export async function generateProject(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const project = projectsStore.findById(req.params.id);
  if (!project) {
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  }

  try {
    projectsStore.update(project.id, { generationStatus: "GENERATING" });

    const result = await aiService.generateApplication(
      project.prompt,
      project.model,
    );

    const updated = projectsStore.update(project.id, {
      generationStatus: "COMPLETED",
      files: result.files,
    });

    res.json({ project: updated });
  } catch (err) {
    projectsStore.update(project.id, { generationStatus: "FAILED" });
    next(err);
  }
}
