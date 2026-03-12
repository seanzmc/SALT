import { useEffect, useState } from "react";
import type { BudgetItemRecord, BudgetItemUpdateInput, PaymentStatus, UserRole } from "@salt/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function BudgetRow({
  item,
  canEdit,
  isSaving,
  onSave
}: {
  item: BudgetItemRecord;
  canEdit: boolean;
  isSaving: boolean;
  onSave: (payload: BudgetItemUpdateInput) => Promise<void>;
}) {
  const [actual, setActual] = useState(String(item.actual));
  const [vendor, setVendor] = useState(item.vendor ?? "");
  const [paidStatus, setPaidStatus] = useState<PaymentStatus>(item.paidStatus);
  const [notes, setNotes] = useState(item.notes ?? "");

  useEffect(() => {
    setActual(String(item.actual));
    setVendor(item.vendor ?? "");
    setPaidStatus(item.paidStatus);
    setNotes(item.notes ?? "");
  }, [item.actual, item.notes, item.paidStatus, item.vendor]);

  return (
    <tr className="border-t border-border align-top">
      <td className="min-w-[18rem] px-4 py-4">
        <p className="font-medium">{item.lineItem}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.category.title}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1">{labelize(item.priority)}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {labelize(item.openingPriority)}
          </span>
          {item.isPdfPlaceholder ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
              Quote placeholder
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-4 text-sm">{formatCurrency(item.estimate)}</td>
      <td className="px-4 py-4 text-sm">{formatCurrency(item.actual)}</td>
      <td
        className={[
          "px-4 py-4 text-sm font-medium",
          item.variance > 0 ? "text-rose-600" : "text-emerald-600"
        ].join(" ")}
      >
        {formatCurrency(item.variance)}
      </td>
      <td className="px-4 py-4 text-sm">{formatDate(item.depositDue)}</td>
      <td className="px-4 py-4 text-sm">
        {item.leadTimeDays ? `${item.leadTimeDays} days` : "N/A"}
      </td>
      <td className="px-4 py-4 text-sm">{item.responsibleOwner?.name ?? "Unassigned"}</td>
      <td className="min-w-[20rem] px-4 py-4">
        <form
          className="grid gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSave({
              itemId: item.id,
              actual: Number(actual) || 0,
              vendor: vendor.trim() || null,
              paidStatus,
              notes: notes.trim() || null
            });
          }}
        >
          <input
            className="rounded-xl border border-border bg-card px-3 py-2"
            disabled={!canEdit || isSaving}
            min={0}
            onChange={(event) => setActual(event.target.value)}
            step="0.01"
            type="number"
            value={actual}
          />
          <input
            className="rounded-xl border border-border bg-card px-3 py-2"
            disabled={!canEdit || isSaving}
            onChange={(event) => setVendor(event.target.value)}
            placeholder="Vendor"
            value={vendor}
          />
          <select
            className="rounded-xl border border-border bg-card px-3 py-2"
            disabled={!canEdit || isSaving}
            onChange={(event) => setPaidStatus(event.target.value as PaymentStatus)}
            value={paidStatus}
          >
            <option value="NOT_PAID">Not paid</option>
            <option value="DEPOSIT_DUE">Deposit due</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="PAID">Paid</option>
          </select>
          <input
            className="rounded-xl border border-border bg-card px-3 py-2"
            disabled={!canEdit || isSaving}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes"
            value={notes}
          />
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canEdit || isSaving}
            type="submit"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </form>
      </td>
    </tr>
  );
}

export function BudgetTable({
  items,
  role,
  savingItemId,
  onSave
}: {
  items: BudgetItemRecord[];
  role?: UserRole;
  savingItemId?: string;
  onSave: (payload: BudgetItemUpdateInput) => Promise<void>;
}) {
  const canEdit = role === "OWNER_ADMIN";

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-border bg-white/85 shadow-sm backdrop-blur">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-4 py-4">Category / line item</th>
              <th className="px-4 py-4">Estimate</th>
              <th className="px-4 py-4">Actual</th>
              <th className="px-4 py-4">Variance</th>
              <th className="px-4 py-4">Deposit due</th>
              <th className="px-4 py-4">Lead time</th>
              <th className="px-4 py-4">Owner</th>
              <th className="px-4 py-4">Update</th>
            </tr>
          </thead>
          <tbody className="bg-white/70">
            {items.map((item) => (
              <BudgetRow
                key={item.id}
                canEdit={canEdit}
                isSaving={savingItemId === item.id}
                item={item}
                onSave={onSave}
              />
            ))}
          </tbody>
        </table>
      </div>
      {!canEdit ? (
        <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">
          Collaborators can review budget lines, but actuals and payment status remain owner-admin
          actions.
        </div>
      ) : null}
    </section>
  );
}
