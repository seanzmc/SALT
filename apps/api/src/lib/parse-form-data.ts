import { Readable } from "node:stream";
import type { Request } from "express";

export async function parseMultipartFormData(request: Request) {
  const url = new URL(request.originalUrl, `http://${request.headers.host ?? "localhost"}`);
  const requestInit: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers: request.headers as HeadersInit,
    body: Readable.toWeb(request) as BodyInit,
    duplex: "half"
  };
  const webRequest = new Request(url, requestInit);

  return webRequest.formData();
}
