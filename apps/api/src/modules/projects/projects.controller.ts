import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { projectsStore } from "./projects.store";
import { createProjectSchema } from "../../common/validation/generation";
import { AppError } from "../../common/errors/app-error";

export function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProjectSchema.parse(req.body);
    const project = projectsStore.create({
      id: randomUUID(),
      name: input.name,
      prompt: input.prompt,
      model: input.model,
      createdAt: new Date().toISOString(),
      sandboxStatus: "NONE",
      generationStatus: "IDLE",
      files: [],
    });
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export function listProjects(_req: Request, res: Response) {
  res.json({ projects: projectsStore.findAll() });
}

export function getProject(req: Request, res: Response, next: NextFunction) {
  const project = projectsStore.findById(req.params.id);
  if (!project) {
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  }
  res.json({ project });
}