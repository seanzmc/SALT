import { useEffect, useMemo, useState } from "react";
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

function SummaryBlock({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-[0.9rem] border border-border/70 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={[
          "mt-2 font-medium",
          tone === "negative"
            ? "text-rose-600"
            : tone === "positive"
              ? "text-emerald-600"
              : "text-foreground"
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function BudgetRowCard({
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
    <article className="grid gap-5 rounded-[1.25rem] border border-border/70 bg-white p-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">{item.lineItem}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.category.title}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="rounded-full border border-border px-2.5 py-1">
              {labelize(item.priority)}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">
              {labelize(item.openingPriority)}
            </span>
            {item.isPdfPlaceholder ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                Quote placeholder
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryBlock label="Estimate" value={formatCurrency(item.estimate)} />
          <SummaryBlock label="Actual" value={formatCurrency(item.actual)} />
          <SummaryBlock
            label="Variance"
            tone={item.variance > 0 ? "negative" : "positive"}
            value={formatCurrency(item.variance)}
          />
          <SummaryBlock label="Paid status" value={labelize(item.paidStatus)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SummaryBlock label="Deposit due" value={formatDate(item.depositDue)} />
          <SummaryBlock
            label="Lead time"
            value={item.leadTimeDays ? `${item.leadTimeDays} days` : "N/A"}
          />
          <SummaryBlock
            label="Responsible owner"
            value={item.responsibleOwner?.name ?? "Unassigned"}
          />
        </div>

        {item.isPdfPlaceholder ? (
          <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This line is still carrying a quote placeholder signal. Use actual spend, vendor, and
            linked documents as the authoritative record once procurement moves.
          </div>
        ) : null}
      </div>

      <form
        className="space-y-3 rounded-[1rem] border border-border/70 bg-muted/18 p-4"
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
        <div>
          <p className="font-medium text-foreground">Update spend</p>
          <p className="text-sm text-muted-foreground">
            Keep this row’s actuals, payment state, and sourcing notes current.
          </p>
        </div>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Actual spend
          </span>
          <input
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            disabled={!canEdit || isSaving}
            min={0}
            onChange={(event) => setActual(event.target.value)}
            step="0.01"
            type="number"
            value={actual}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Vendor
          </span>
          <input
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            disabled={!canEdit || isSaving}
            onChange={(event) => setVendor(event.target.value)}
            placeholder="Vendor name"
            value={vendor}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Payment status
          </span>
          <select
            className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            disabled={!canEdit || isSaving}
            onChange={(event) => setPaidStatus(event.target.value as PaymentStatus)}
            value={paidStatus}
          >
            <option value="NOT_PAID">Not paid</option>
            <option value="DEPOSIT_DUE">Deposit due</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="PAID">Paid</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Notes
          </span>
          <textarea
            className="min-h-28 w-full rounded-[1rem] border border-border bg-white px-4 py-3"
            disabled={!canEdit || isSaving}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Quote status, approval notes, or payment context"
            value={notes}
          />
        </label>

        <button
          className="w-full rounded-[1rem] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canEdit || isSaving}
          type="submit"
        >
          {isSaving ? "Saving..." : "Save budget line"}
        </button>

        {!canEdit ? (
          <p className="text-sm text-muted-foreground">
            Collaborators can review budget lines, but actuals and payment status remain owner-admin
            actions.
          </p>
        ) : null}
      </form>
    </article>
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
  const groupedItems = useMemo(() => {
    const groups = new Map<
      string,
      {
        title: string;
        items: BudgetItemRecord[];
      }
    >();

    items.forEach((item) => {
      const group = groups.get(item.category.id);

      if (group) {
        group.items.push(item);
        return;
      }

      groups.set(item.category.id, {
        title: item.category.title,
        items: [item]
      });
    });

    return Array.from(groups.values());
  }, [items]);

  return (
    <div className="space-y-6">
      {groupedItems.map((group) => {
        const estimated = group.items.reduce((sum, item) => sum + item.estimate, 0);
        const actual = group.items.reduce((sum, item) => sum + item.actual, 0);

        return (
          <section key={group.title} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-3">
              <div>
                <h3 className="font-medium text-foreground">{group.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {group.items.length} budget line{group.items.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <span className="rounded-full border border-border px-2.5 py-1">
                  Estimate {formatCurrency(estimated)}
                </span>
                <span className="rounded-full border border-border px-2.5 py-1">
                  Actual {formatCurrency(actual)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {group.items.map((item) => (
                <BudgetRowCard
                  key={item.id}
                  canEdit={canEdit}
                  isSaving={savingItemId === item.id}
                  item={item}
                  onSave={onSave}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
