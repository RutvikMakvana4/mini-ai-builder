import express from "express";
import cors from "cors";
import { projectsRouter } from "./modules/projects/projects.routes";
import { generationRouter } from "./modules/generation/generation.routes";
import { listFiles, getFile } from "./modules/projects/files.controller";
import { errorHandler } from "./common/errors/error-handler";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/projects", projectsRouter);
  app.use("/api/projects/:id/generate", generationRouter);
  app.get("/api/projects/:id/files", listFiles);
  app.get("/api/projects/:id/files/:path(.*)", getFile);

  app.use(errorHandler);
  return app;
}