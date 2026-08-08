import { Router } from "express";
import { deployProject } from "./deployment.controller";

export const deploymentRouter = Router({ mergeParams: true });
deploymentRouter.post("/", deployProject);