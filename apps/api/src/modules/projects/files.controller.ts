import { Request, Response, NextFunction } from "express";
import { projectsStore } from "./projects.store";
import { AppError } from "../../common/errors/app-error";

export function listFiles(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project)
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  res.json({ files: project.files });
}

export function getFile(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project)
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));

  const splat = Array.isArray(req.params.splat)
    ? req.params.splat
    : [req.params.splat];
  const path = splat.join("/");

  const file = project.files.find((f) => f.path === path);
  if (!file) return next(new AppError("FILE_NOT_FOUND", "File not found", 404));
  res.json({ file });
}

export function updateFile(req: Request, res: Response, next: NextFunction) {
  const projectId = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;
  const project = projectsStore.findById(projectId);
  if (!project)
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));

  const splat = Array.isArray(req.params.splat)
    ? req.params.splat
    : [req.params.splat];
  const path = splat.join("/");

  const { content } = req.body ?? {};
  if (typeof content !== "string") {
    return next(
      new AppError("VALIDATION_ERROR", "content must be a string", 400),
    );
  }

  const existingIndex = project.files.findIndex((f) => f.path === path);
  const files =
    existingIndex >= 0
      ? project.files.map((f, i) =>
          i === existingIndex ? { ...f, content } : f,
        )
      : [...project.files, { path, content }];

  const updated = projectsStore.update(project.id, { files });
  const file = updated?.files.find((f) => f.path === path);
  res.json({ file });
}
