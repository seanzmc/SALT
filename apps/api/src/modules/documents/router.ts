import { Readable } from "node:stream";
import { Router } from "express";
import { get } from "@vercel/blob";

import {
  getDocumentAccess,
  getDocumentWorkspace,
  linkDocumentToTaskCommand,
  listDocuments,
  unlinkDocumentFromTaskCommand,
  uploadDocumentCommand
} from "@salt/domain";
import type {
  DocumentListFilters,
  DocumentTaskLinkInput,
  DocumentTaskUnlinkInput,
  DocumentUploadMetadataInput
} from "@salt/types";
import {
  documentIdParamSchema,
  documentListQuerySchema,
  documentTaskLinkSchema,
  documentTaskUnlinkSchema,
  documentUploadMetadataSchema
} from "@salt/validation";

import { AppError } from "../../lib/app-error";
import { asyncHandler } from "../../lib/async-handler";
import { parseMultipartFormData } from "../../lib/parse-form-data";
import { requireSession } from "../../middleware/auth-session";

export const documentsRouter = Router();

function validationError(message: string, fieldErrors?: Record<string, string[] | undefined>) {
  return new AppError(400, "VALIDATION_ERROR", message, fieldErrors);
}

function buildContentDisposition(fileName: string, download: boolean) {
  const encodedFileName = encodeURIComponent(fileName);
  const type = download ? "attachment" : "inline";

  return `${type}; filename*=UTF-8''${encodedFileName}`;
}

documentsRouter.use(requireSession);

documentsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const parsed = documentListQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      throw validationError("Invalid document query filters.");
    }

    const filters: DocumentListFilters = parsed.data;

    response.status(200).json(await listDocuments(filters));
  })
);

documentsRouter.get(
  "/:documentId",
  asyncHandler(async (request, response) => {
    const parsed = documentIdParamSchema.safeParse(request.params);

    if (!parsed.success) {
      throw validationError("Invalid document id.");
    }

    const data = await getDocumentWorkspace(parsed.data.documentId);

    if (!data.document) {
      throw new AppError(404, "NOT_FOUND", "Document not found.");
    }

    response.status(200).json(data);
  })
);

documentsRouter.get(
  "/:documentId/file",
  asyncHandler(async (request, response) => {
    const parsed = documentIdParamSchema.safeParse(request.params);

    if (!parsed.success) {
      throw validationError("Invalid document id.");
    }

    const document = await getDocumentAccess(parsed.data.documentId);

    if (!document) {
      throw new AppError(404, "NOT_FOUND", "Document not found.");
    }

    const shouldDownload = request.query.download === "1";

    if (document.storagePath.startsWith("/")) {
      response.redirect(document.storagePath);
      return;
    }

    try {
      const blob = await get(document.storagePath, {
        access: "private"
      });

      if (!blob || blob.statusCode !== 200) {
        throw new AppError(404, "NOT_FOUND", "Document file not found.");
      }

      response.setHeader(
        "content-type",
        blob.blob.contentType || document.mimeType
      );
      response.setHeader(
        "content-disposition",
        buildContentDisposition(document.originalName, shouldDownload)
      );
      response.setHeader("cache-control", "private, no-store");

      if (blob.blob.etag) {
        response.setHeader("etag", blob.blob.etag);
      }

      Readable.fromWeb(blob.stream as unknown as import("node:stream/web").ReadableStream).pipe(
        response
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      response.redirect(document.storagePath);
    }
  })
);

documentsRouter.post(
  "/upload",
  asyncHandler(async (request, response) => {
    const formData = await parseMultipartFormData(request);
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw validationError("File is required.");
    }

    const parsed = documentUploadMetadataSchema.safeParse({
      title: formData.get("title"),
      category: formData.get("category"),
      notes: formData.get("notes"),
      linkedTaskId: formData.get("linkedTaskId"),
      linkedBudgetItemId: formData.get("linkedBudgetItemId")
    });

    if (!parsed.success) {
      throw validationError(
        parsed.error.flatten().formErrors[0] ?? "Invalid upload payload.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: DocumentUploadMetadataInput = {
      title: parsed.data.title,
      category: parsed.data.category,
      notes: parsed.data.notes || null,
      linkedTaskId: parsed.data.linkedTaskId || null,
      linkedBudgetItemId: parsed.data.linkedBudgetItemId || null
    };

    const data = await uploadDocumentCommand({
      actor: request.authSession!.user,
      payload,
      file
    });

    response.status(201).json(data);
  })
);

documentsRouter.post(
  "/:documentId/tasks",
  asyncHandler(async (request, response) => {
    const parsed = documentTaskLinkSchema.safeParse({
      documentId: request.params.documentId,
      taskId: request.body.taskId
    });

    if (!parsed.success) {
      throw validationError(
        "Please select a valid task.",
        parsed.error.flatten().fieldErrors
      );
    }

    const payload: DocumentTaskLinkInput = parsed.data;

    response.status(200).json(
      await linkDocumentToTaskCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);

documentsRouter.delete(
  "/:documentId/tasks/:taskId",
  asyncHandler(async (request, response) => {
    const parsed = documentTaskUnlinkSchema.safeParse(request.params);

    if (!parsed.success) {
      throw validationError("Invalid document-task link.");
    }

    const payload: DocumentTaskUnlinkInput = parsed.data;

    response.status(200).json(
      await unlinkDocumentFromTaskCommand({
        actor: request.authSession!.user,
        payload
      })
    );
  })
);
