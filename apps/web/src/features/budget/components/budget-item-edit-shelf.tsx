import { useEffect, useState } from "react";
import type { BudgetItemRecord, BudgetItemUpdateInput, PaymentStatus } from "@salt/types";

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

export function BudgetItemEditShelf({
  item,
  isSaving,
  error,
  onClose,
  onSave
}: {
  item: BudgetItemRecord;
  isSaving: boolean;
  error?: string;
  onClose: () => void;
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
  }, [item.actual, item.id, item.notes, item.paidStatus, item.vendor]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/80 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Budget edit shelf
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">{item.lineItem}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.category.title} • Estimate {formatCurrency(item.estimate)} • Deposit due{" "}
              {formatDate(item.depositDue)}
            </p>
          </div>
          <button
            className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>

      <form
        className="flex-1 space-y-5 overflow-y-auto bg-[rgba(232,244,241,0.34)] px-5 py-5"
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
        <section className="rounded-[1.25rem] border border-border/70 bg-white p-4">
          <p className="font-semibold text-foreground">Owner update workspace</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Update actual spend, payment state, vendor context, and notes without keeping the main
            budget page in edit mode.
          </p>
          {error ? (
            <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        <div className="space-y-3 rounded-[1rem] border border-border/70 bg-white p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Financial update
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture the latest actual spend and payment position for this line.
            </p>
          </div>

          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Actual spend
            </span>
            <input
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              disabled={isSaving}
              min={0}
              onChange={(event) => setActual(event.target.value)}
              step="0.01"
              type="number"
              value={actual}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Payment status
            </span>
            <select
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setPaidStatus(event.target.value as PaymentStatus)}
              value={paidStatus}
            >
              <option value="NOT_PAID">Not paid</option>
              <option value="DEPOSIT_DUE">Deposit due</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="PAID">Paid</option>
            </select>
          </label>
        </div>

        <div className="space-y-3 rounded-[1rem] border border-border/70 bg-white p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vendor context
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep sourcing, quote, and payment notes attached to the same budget line.
            </p>
          </div>

          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vendor
            </span>
            <input
              className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setVendor(event.target.value)}
              placeholder="Vendor name"
              value={vendor}
            />
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Notes
            </span>
            <textarea
              className="min-h-28 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
              disabled={isSaving}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Quote status, approval notes, or payment context"
              value={notes}
            />
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pb-2">
          <button
            className="rounded-[1rem] border border-border bg-white px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-[1rem] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Saving..." : "Save budget line"}
          </button>
        </div>

        <div className="rounded-[1rem] border border-border/70 bg-white px-4 py-3 text-sm leading-6 text-muted-foreground">
          Paid status is currently {labelize(item.paidStatus)} and the responsible owner is{" "}
          {item.responsibleOwner?.name ?? "unassigned"}.
        </div>
      </form>
    </div>
  );
}
