import { Router } from "express";
import { streamEvents } from "./events.controller";

export const eventsRouter = Router({ mergeParams: true });
eventsRouter.get("/", streamEvents);