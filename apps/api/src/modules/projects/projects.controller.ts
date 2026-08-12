import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { projectsStore } from "./projects.store";
import { createProjectSchema } from "../../common/validation/generation";
import { AppError } from "../../common/errors/app-error";
import { ProjectParams } from "../../common/types/http";

export function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProjectSchema.parse(req.body);
    const project = projectsStore.create({
      id: randomUUID(),
      name: input.name,
      prompt: input.prompt,
      model: input.model,
      createdAt: new Date().toISOString(),
      generationStatus: "IDLE",
      buildStatus: "NOT_STARTED",
      sandboxStatus: "NONE",
      deploymentStatus: "IDLE",
      repairAttempts: 0,
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

export function getProject(
  req: Request<ProjectParams>,
  res: Response,
  next: NextFunction,
) {
  const project = projectsStore.findById(req.params.id);
  if (!project) {
    return next(new AppError("PROJECT_NOT_FOUND", "Project not found", 404));
  }
  res.json({ project });
}
