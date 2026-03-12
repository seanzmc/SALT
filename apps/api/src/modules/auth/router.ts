import { Router } from "express";

import {
  SESSION_COOKIE_NAME,
  authenticateWithCredentials,
  createSessionToken
} from "@salt/domain";
import { loginSchema } from "@salt/validation";

import { apiEnv } from "../../config/env";
import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { requireSession } from "../../middleware/auth-session";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Enter a valid email and password.");
    }

    const session = await authenticateWithCredentials(parsed.data.email, parsed.data.password);

    if (!session) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const token = createSessionToken(
      { userId: session.user.id },
      apiEnv.SESSION_SECRET
    );

    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: apiEnv.NODE_ENV === "production",
      path: "/"
    });

    response.status(200).json(session);
  })
);

authRouter.post("/logout", (_request, response) => {
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: apiEnv.NODE_ENV === "production",
    path: "/"
  });
  response.status(204).end();
});

authRouter.get(
  "/me",
  requireSession,
  asyncHandler(async (request, response) => {
    response.status(200).json(request.authSession);
  })
);
