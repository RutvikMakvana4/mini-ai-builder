import { Request, Response, NextFunction } from "express";
import { projectsStore } from "../projects/projects.store";
import { runBuildPipeline } from "./build.service";
import { AppError } from "../../common/errors/app-error";

export async function triggerBuild(req: Request, res: Response, next: NextFunction) {
  const project = projectsStore.findById(req.params.id);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  if (project.files.length === 0) {
    return next(new AppError("NO_FILES", "Generate the project before building", 400));
  }

  try {
    const record = await runBuildPipeline(project);
    const updated = projectsStore.findById(project.id);
    res.json({ project: updated, build: record });
  } catch (err) {
    next(err);
  }
}