import { accountRouter } from "./modules/account/router.js";
import { adminRouter } from "./modules/admin/router.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

import { apiEnv } from "./config/env.js";
import { attachSession } from "./middleware/auth-session.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/router.js";
import { budgetRouter } from "./modules/budget/router.js";
import { dashboardRouter } from "./modules/dashboard/router.js";
import { documentsRouter } from "./modules/documents/router.js";
import { messagesRouter } from "./modules/messages/router.js";
import { tasksRouter } from "./modules/tasks/router.js";
import { timelineRouter } from "./modules/timeline/router.js";

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

  app.use("/api/account", accountRouter);
  app.use("/api/admin", adminRouter);
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

const app = createApp();

export default app;
