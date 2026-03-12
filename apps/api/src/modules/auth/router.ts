import { Router } from "express";

import {
  SESSION_COOKIE_NAME,
  authenticateWithCredentials,
  createSessionToken,
  isPasswordResetTokenValid,
  requestPasswordResetCommand,
  resetPasswordWithTokenCommand
} from "@salt/domain";
import type { ForgotPasswordInput, ResetPasswordInput } from "@salt/types";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema
} from "@salt/validation";

import { apiEnv } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendPasswordResetEmail } from "../../lib/password-reset-email.js";
import { requireSession } from "../../middleware/auth-session.js";

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

authRouter.post(
  "/password/forgot",
  asyncHandler(async (request, response) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Please enter a valid email address.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: ForgotPasswordInput = {
      email: parsed.data.email
    };

    const result = await requestPasswordResetCommand({
      email: payload.email,
      baseUrl: apiEnv.WEB_ORIGIN
    });

    if (result.delivery) {
      try {
        await sendPasswordResetEmail(result.delivery);
      } catch (error) {
        console.error("[password-reset] Failed to send reset email", error);
      }
    }

    response.status(200).json({ message: result.message });
  })
);

authRouter.get(
  "/password/reset/validate",
  asyncHandler(async (request, response) => {
    const token = typeof request.query.token === "string" ? request.query.token : "";

    response.status(200).json({
      valid: token ? await isPasswordResetTokenValid(token) : false
    });
  })
);

authRouter.post(
  "/password/reset",
  asyncHandler(async (request, response) => {
    const parsed = resetPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Please correct the highlighted password fields.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: ResetPasswordInput = {
      token: parsed.data.token,
      newPassword: parsed.data.newPassword,
      confirmPassword: parsed.data.confirmPassword
    };

    response.status(200).json(
      await resetPasswordWithTokenCommand({
        token: payload.token,
        newPassword: payload.newPassword
      })
    );
  })
);
