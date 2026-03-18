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

function isRelativeApiRoute(input: RequestInfo) {
  if (typeof input === "string") {
    return input.startsWith("/api/");
  }

  if (input instanceof Request) {
    try {
      const url = new URL(input.url, window.location.origin);
      return url.pathname.startsWith("/api/");
    } catch {
      return false;
    }
  }

  return false;
}

export async function apiClient<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...(init?.headers ?? {})
      }
    });
  } catch (error) {
    throw new ApiClientError(
      error instanceof Error ? error.message : "Network request failed.",
      0
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T | ApiErrorResponse)
    : ({
        error: {
          code: "INTERNAL_ERROR",
          message:
            response.status === 404 && isRelativeApiRoute(input)
              ? "This deployment does not provide the SALT API."
              : await response.text()
        }
      } satisfies ApiErrorResponse);

  if (!response.ok) {
    throw new ApiClientError(
      (payload as ApiErrorResponse).error?.message ?? "Request failed.",
      response.status,
      payload as ApiErrorResponse
    );
  }

  return payload as T;
}
