import { Router } from "express";
import { generateProject } from "./generation.controller";

export const generationRouter = Router({ mergeParams: true });
generationRouter.post("/", generateProject);