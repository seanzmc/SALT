import { ActivityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile } from "@/lib/storage";
import { documentUploadSchema } from "@/lib/validators";
import { logActivity } from "@/server/activity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  const parsed = documentUploadSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    notes: formData.get("notes"),
    linkedTaskId: formData.get("linkedTaskId"),
    linkedBudgetItemId: formData.get("linkedBudgetItemId")
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors[0] ?? "Invalid upload payload." }, { status: 400 });
  }

  try {
    if (parsed.data.linkedTaskId) {
      const task = await prisma.task.findUnique({
        where: { id: parsed.data.linkedTaskId },
        select: {
          id: true,
          archivedAt: true,
          assignedToId: true
        }
      });

      if (!task) {
        return NextResponse.json({ error: "Task not found." }, { status: 404 });
      }

      if (task.archivedAt) {
        return NextResponse.json(
          { error: "Archived tasks cannot receive new document attachments." },
          { status: 400 }
        );
      }

      if (
        session.user.role !== "OWNER_ADMIN" &&
        task.assignedToId !== session.user.id
      ) {
        return NextResponse.json(
          { error: "Collaborators can only attach documents to tasks assigned to them." },
          { status: 403 }
        );
      }
    }

    const storedFile = await saveUploadedFile(file);

    const document = await prisma.document.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        notes: parsed.data.notes || null,
        linkedTaskId: parsed.data.linkedTaskId || null,
        linkedBudgetItemId: parsed.data.linkedBudgetItemId || null,
        uploadedById: session.user.id,
        ...storedFile
      }
    });

    if (parsed.data.linkedTaskId) {
      await prisma.taskAttachment.create({
        data: {
          taskId: parsed.data.linkedTaskId,
          documentId: document.id
        }
      });
    }

    await logActivity({
      actorId: session.user.id,
      taskId: parsed.data.linkedTaskId || null,
      type: ActivityType.DOCUMENT_UPLOADED,
      entityType: "Document",
      entityId: document.id,
      description: `Uploaded document "${document.title}".`
    });

    revalidatePath("/documents");
    revalidatePath("/dashboard");
    if (parsed.data.linkedTaskId) {
      revalidatePath(`/checklists/${parsed.data.linkedTaskId}`);
    }

    return NextResponse.json({ ok: true, documentId: document.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 }
    );
  }
}
