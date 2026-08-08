import { Router } from "express";
import { createSandbox, destroySandbox } from "./sandbox.controller";

export const sandboxRouter = Router({ mergeParams: true });
sandboxRouter.post("/", createSandbox);
sandboxRouter.delete("/", destroySandbox);