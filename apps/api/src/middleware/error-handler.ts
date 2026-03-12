import type { NextFunction, Request, Response } from "express";

import { DomainError } from "@salt/domain";

import { AppError } from "../lib/app-error";

export function notFoundHandler(
  _request: Request,
  _response: Response,
  next: NextFunction
) {
  next(new AppError(404, "NOT_FOUND", "Route not found."));
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors
      }
    });
    return;
  }

  if (error instanceof DomainError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors
      }
    });
    return;
  }

  console.error("[api] Unhandled error", error);

  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred."
    }
  });
}
