import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

import { apiEnv } from "./config/env";
import { attachSession } from "./middleware/auth-session";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/router";
import { budgetRouter } from "./modules/budget/router";
import { dashboardRouter } from "./modules/dashboard/router";
import { documentsRouter } from "./modules/documents/router";
import { messagesRouter } from "./modules/messages/router";
import { tasksRouter } from "./modules/tasks/router";
import { timelineRouter } from "./modules/timeline/router";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: apiEnv.WEB_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachSession);

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ ok: true, service: "salt-api" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/budget", budgetRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/documents", documentsRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/timeline", timelineRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
