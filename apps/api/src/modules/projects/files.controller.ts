import { Request, Response, NextFunction } from "express";
import { projectsStore } from "./projects.store";
import { AppError } from "../../common/errors/app-error";

export function listFiles(req: Request, res: Response, next: NextFunction) {
  const project = projectsStore.findById(req.params.id);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  res.json({ files: project.files });
}

export function getFile(req: Request, res: Response, next: NextFunction) {
  const project = projectsStore.findById(req.params.id);
  if (!project) return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  const pathParam = (req.params as any).path ?? (req.params as any)[0] ?? "";
  const path = decodeURIComponent(pathParam);
  const file = project.files.find((f) => f.path === path);
  if (!file) return next(new AppError("FILE_NOT_FOUND", "File not found", 404));
  res.json({ file });
}