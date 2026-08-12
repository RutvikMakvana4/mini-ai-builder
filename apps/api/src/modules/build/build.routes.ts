import { Router } from "express";
import { triggerBuild, restartBuild } from "./build.controller";

export const buildRouter = Router({ mergeParams: true });
buildRouter.post("/", triggerBuild);
buildRouter.post("/restart", restartBuild);