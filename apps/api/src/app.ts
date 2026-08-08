import express from "express";
import cors from "cors";
import { projectsRouter } from "./modules/projects/projects.routes";
import { generationRouter } from "./modules/generation/generation.routes";
import { listFiles, getFile } from "./modules/projects/files.controller";
import { sandboxRouter } from "./modules/sandbox/sandbox.routes";
import { buildRouter } from "./modules/build/build.routes";
import { eventsRouter } from "./modules/events/events.routes";
import { errorHandler } from "./common/errors/error-handler";
import { deploymentRouter } from "./modules/deployment/deployment.routes";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/projects", projectsRouter);
  app.use("/api/projects/:id/generate", generationRouter);
  app.use("/api/projects/:id/sandbox", sandboxRouter);
  app.use("/api/projects/:id/build", buildRouter);
  app.use("/api/projects/:id/events", eventsRouter);
  app.use("/api/projects/:id/deploy", deploymentRouter);
  app.get("/api/projects/:id/files", listFiles);
  app.get("/api/projects/:id/files/*splat", getFile);

  app.use(errorHandler);
  return app;
}
