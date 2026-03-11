import path from "node:path";
import { put } from "@vercel/blob";

const maxFileSizeBytes = 10 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function saveUploadedFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Unsupported file type.");
  }

  if (file.size > maxFileSizeBytes) {
    throw new Error("File exceeds 10MB size limit.");
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Document uploads require Vercel Blob. Set BLOB_READ_WRITE_TOKEN before uploading files."
    );
  }

  const extension = path.extname(file.name) || "";
  const safeBaseName = path
    .basename(file.name, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "document";
  const fileName = `documents/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeBaseName}${extension.toLowerCase()}`;
  const blob = await put(fileName, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type || "application/octet-stream"
  });

  return {
    storagePath: blob.url,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    originalName: file.name
  };
}

export function getStoragePolicySummary() {
  return "Files are stored in a private Vercel Blob store with authenticated application routes serving access.";
}
