import type { NextFunction, Request, Response } from "express";

import {
  SESSION_COOKIE_NAME,
  getSessionUserById,
  isOwner,
  verifySessionToken
} from "@salt/domain";

import { apiEnv } from "../config/env.js";
import { AppError } from "../lib/app-error.js";

export async function attachSession(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  request.authSession = null;

  const token = request.cookies?.[SESSION_COOKIE_NAME];

  if (!token) {
    next();
    return;
  }

  const payload = verifySessionToken(token, apiEnv.SESSION_SECRET);

  if (!payload) {
    next();
    return;
  }

  request.authSession = await getSessionUserById(payload.userId);
  next();
}

export function requireSession(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  if (!request.authSession) {
    next(new AppError(401, "UNAUTHORIZED", "Sign in is required."));
    return;
  }

  next();
}

export function requireOwner(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  if (!request.authSession) {
    next(new AppError(401, "UNAUTHORIZED", "Sign in is required."));
    return;
  }

  if (!isOwner(request.authSession.user)) {
    next(new AppError(403, "FORBIDDEN", "Owner access is required."));
    return;
  }

  next();
}
