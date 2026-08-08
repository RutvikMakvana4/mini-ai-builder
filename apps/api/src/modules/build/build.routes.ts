import { Router } from "express";
import { triggerBuild } from "./build.controller";

export const buildRouter = Router({ mergeParams: true });
buildRouter.post("/", triggerBuild);