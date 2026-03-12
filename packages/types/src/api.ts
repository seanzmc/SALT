import type { AuthErrorCode } from "./auth";

export type ApiErrorResponse = {
  error: {
    code: AuthErrorCode | "INTERNAL_ERROR";
    message: string;
    fieldErrors?: Record<string, string[] | undefined>;
  };
};
