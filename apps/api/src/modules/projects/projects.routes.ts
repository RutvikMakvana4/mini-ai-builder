import { Router } from "express";
import { createProject, listProjects, getProject } from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.post("/", createProject);
projectsRouter.get("/", listProjects);
projectsRouter.get("/:id", getProject);