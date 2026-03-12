import { Readable } from "node:stream";
import type { Request } from "express";

export async function parseMultipartFormData(request: Request) {
  const url = new URL(request.originalUrl, `http://${request.headers.host ?? "localhost"}`);
  const webRequest = new Request(url, {
    method: request.method,
    headers: request.headers as HeadersInit,
    body: Readable.toWeb(request) as BodyInit
  } as RequestInit & { duplex: "half" });

  return webRequest.formData();
}
