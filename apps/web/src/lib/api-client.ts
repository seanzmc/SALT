import type { ApiErrorResponse } from "@salt/types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorResponse
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiClient<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as T | ApiErrorResponse;

  if (!response.ok) {
    throw new ApiClientError(
      (payload as ApiErrorResponse).error?.message ?? "Request failed.",
      response.status,
      payload as ApiErrorResponse
    );
  }

  return payload as T;
}
