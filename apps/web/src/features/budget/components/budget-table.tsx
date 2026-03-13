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

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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
    <div className="rounded-[0.95rem] border border-border/70 bg-white px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={joinClasses(
          "mt-2 font-medium break-words",
          tone === "negative"
            ? "text-rose-600"
            : tone === "positive"
              ? "text-emerald-600"
              : "text-foreground"
        )}
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
    <article className="grid gap-5 rounded-[1.2rem] border border-border/75 bg-white/82 p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.35)] xl:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Budget line
            </p>
            <p className="mt-2 break-words text-lg font-semibold text-foreground">
              {item.lineItem}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{item.category.title}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="rounded-full border border-border bg-white px-2.5 py-1">
              {labelize(item.priority)}
            </span>
            <span className="rounded-full border border-border bg-white px-2.5 py-1">
              {labelize(item.openingPriority)}
            </span>
            {item.isPdfPlaceholder ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                Quote placeholder
              </span>
            ) : null}
          </div>
        </div>

        <section className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Financial signal
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Read the estimate, actuals, and variance first before editing the line.
            </p>
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
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Context
            </p>
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
        </section>

        {item.isPdfPlaceholder ? (
          <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            This line is still carrying a quote placeholder signal. Use actual spend, vendor, and
            linked documents as the authoritative record once procurement moves.
          </div>
        ) : null}
      </div>

      <form
        className="space-y-4 rounded-[1rem] border border-border/75 bg-[rgba(232,244,241,0.54)] p-4"
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
          <p className="font-semibold text-foreground">Update controls</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Keep actuals, payment state, and sourcing notes current without digging through the row.
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
          <p className="text-sm leading-6 text-muted-foreground">
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const canEdit = role === "OWNER_ADMIN";
  const groupedItems = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
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
        key: item.category.id,
        title: item.category.title,
        items: [item]
      });
    });

    return Array.from(groups.values());
  }, [items]);

  return (
    <div className="space-y-5">
      {groupedItems.map((group) => {
        const estimated = group.items.reduce((sum, item) => sum + item.estimate, 0);
        const actual = group.items.reduce((sum, item) => sum + item.actual, 0);
        const isOpen = openGroups[group.key] ?? true;

        return (
          <section
            key={group.key}
            className="rounded-[1.35rem] border border-border/75 bg-[rgba(255,255,255,0.7)] shadow-[0_18px_50px_-44px_rgba(15,23,42,0.32)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Category
                </p>
                <h3 className="mt-2 break-words text-lg font-semibold text-foreground">
                  {group.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {group.items.length} budget line{group.items.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Estimate {formatCurrency(estimated)}
                </span>
                <span className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Actual {formatCurrency(actual)}
                </span>
                <button
                  className="rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-muted"
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [group.key]: !isOpen
                    }))
                  }
                  type="button"
                >
                  {isOpen ? "Collapse" : "Expand"}
                </button>
              </div>
            </div>

            {isOpen ? (
              <div className="border-t border-border/70 px-5 py-5">
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
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
