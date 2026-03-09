import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadRoot = path.join(process.cwd(), "public", "uploads");
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

  await mkdir(uploadRoot, { recursive: true });

  const extension = path.extname(file.name) || "";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
  const absolutePath = path.join(uploadRoot, fileName);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(absolutePath, Buffer.from(arrayBuffer));

  return {
    storagePath: `/uploads/${fileName}`,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    originalName: file.name
  };
}

export function getStoragePolicySummary() {
  return "Files are stored locally under public/uploads with DB metadata isolated for later S3 replacement.";
}
