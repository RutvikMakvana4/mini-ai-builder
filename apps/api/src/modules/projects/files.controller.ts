import { Request, Response, NextFunction } from "express";
import { projectsStore } from "./projects.store";
import { AppError } from "../../common/errors/app-error";

export function listFiles(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  res.json({ files: project.files });
}

export function getFile(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));

  const splat = Array.isArray(req.params.splat) ? req.params.splat : [req.params.splat];
  const path = splat.join("/");

  const file = project.files.find((f) => f.path === path);
  if (!file) return next(new AppError("FILE_NOT_FOUND", "File not found", 404));
  res.json({ file });
}