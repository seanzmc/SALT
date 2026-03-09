"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DocumentUploadForm({
  tasks,
  budgetItems
}: {
  tasks: Array<{ id: string; title: string }>;
  budgetItems: Array<{ id: string; lineItem: string }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Upload failed.");
      return;
    }

    setMessage("Upload complete.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Document title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" required>
            <option value="PERMIT">Permit</option>
            <option value="CONTRACT">Contract</option>
            <option value="INSURANCE">Insurance</option>
            <option value="VENDOR_QUOTE">Vendor quote</option>
            <option value="EQUIPMENT_SPEC">Equipment spec</option>
            <option value="FLOOR_PLAN">Floor plan</option>
            <option value="INSPECTION_RECORD">Inspection record</option>
            <option value="POLICY_MANUAL">Policy/manual</option>
            <option value="COMPLIANCE_DOCUMENT">Compliance document</option>
            <option value="INVOICE">Invoice</option>
            <option value="PHOTO">Photo</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedTaskId">Linked task</Label>
          <Select id="linkedTaskId" name="linkedTaskId">
            <option value="">No task link</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedBudgetItemId">Linked budget item</Label>
          <Select id="linkedBudgetItemId" name="linkedBudgetItemId">
            <option value="">No budget link</option>
            {budgetItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.lineItem}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="file">File</Label>
          <Input id="file" name="file" required type="file" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button disabled={isPending} type="submit">
          {isPending ? "Uploading..." : "Upload document"}
        </Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
