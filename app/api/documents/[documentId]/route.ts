import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function buildContentDisposition(fileName: string, download: boolean) {
  const encodedFileName = encodeURIComponent(fileName);
  const type = download ? "attachment" : "inline";

  return `${type}; filename*=UTF-8''${encodedFileName}`;
}

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: {
      id: true,
      storagePath: true,
      mimeType: true,
      originalName: true
    }
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const shouldDownload = url.searchParams.get("download") === "1";

  if (document.storagePath.startsWith("/")) {
    return NextResponse.redirect(new URL(document.storagePath, request.url));
  }

  try {
    const blob = await get(document.storagePath, {
      access: "private"
    });

    if (!blob || blob.statusCode !== 200) {
      return NextResponse.json({ error: "Document file not found." }, { status: 404 });
    }

    return new Response(blob.stream, {
      headers: {
        "content-type": blob.blob.contentType || document.mimeType,
        "content-disposition": buildContentDisposition(document.originalName, shouldDownload),
        "cache-control": "private, no-store",
        etag: blob.blob.etag
      }
    });
  } catch {
    // Preserve older public or local-style URLs that may already exist in the database.
    return NextResponse.redirect(document.storagePath);
  }
}
