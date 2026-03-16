import path from "node:path";
import { del, put } from "@vercel/blob";

import { DomainError } from "../shared/domain-error.js";

const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

export async function saveUploadedFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new DomainError(
      400,
      "VALIDATION_ERROR",
      "Unsupported file type. Upload a PDF, JPG, PNG, WEBP, TXT, DOCX, MD, CSV, XLSX, HEIC, or HEIF file."
    );
  }

  if (file.size > maxFileSizeBytes) {
    throw new DomainError(400, "VALIDATION_ERROR", "File exceeds the 10 MB size limit.");
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new DomainError(
      500,
      "INTERNAL_ERROR",
      "Document storage is not configured. Set BLOB_READ_WRITE_TOKEN before uploading files."
    );
  }

  const extension = path.extname(file.name) || "";
  const safeBaseName =
    path
      .basename(file.name, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document";
  const fileName = `documents/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${safeBaseName}${extension.toLowerCase()}`;
  let blob;

  try {
    blob = await put(fileName, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream"
    });
  } catch (error) {
    console.error("[documents] Failed to persist uploaded file", error);
    throw new DomainError(
      500,
      "INTERNAL_ERROR",
      "Document storage is unavailable right now. Please try again."
    );
  }

  return {
    storagePath: blob.url,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    originalName: file.name
  };
}

export async function deleteStoredFile(storagePath: string) {
  if (!storagePath || storagePath.startsWith("/") || storagePath.startsWith("seed://")) {
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new DomainError(
      500,
      "INTERNAL_ERROR",
      "Document storage is not configured. Set BLOB_READ_WRITE_TOKEN before deleting files."
    );
  }

  try {
    await del(storagePath);
  } catch (error) {
    console.error("[documents] Failed to delete stored file", error);
    throw new DomainError(
      500,
      "INTERNAL_ERROR",
      "Document storage is unavailable right now. Please try again."
    );
  }
}
