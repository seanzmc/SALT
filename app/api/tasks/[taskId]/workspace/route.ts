import { NextResponse } from "next/server";

import { serializeTaskWorkspaceData } from "@/lib/checklist-workspace";
import { requireSession } from "@/server/authz";
import { getTaskWorkspaceData } from "@/server/tasks";

export async function GET(
  _request: Request,
  { params }: { params: { taskId: string } }
) {
  await requireSession();

  const data = await getTaskWorkspaceData(params.taskId);

  return NextResponse.json(serializeTaskWorkspaceData(data));
}
