import { Role } from "@prisma/client";

import { updateBudgetItemAction } from "@/server/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export function BudgetTable({
  items,
  currentRole
}: {
  items: Array<{
    id: string;
    lineItem: string;
    category: { title: string };
    priority: string;
    openingPriority: string;
    estimate: unknown;
    actual: unknown;
    vendor: string | null;
    depositDue: Date | null;
    leadTimeDays: number | null;
    responsibleOwner: { name: string } | null;
    notes: string | null;
    paidStatus: string;
    isPdfPlaceholder: boolean;
  }>;
  currentRole: Role;
}) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category / line item</TableHead>
            <TableHead>Estimate</TableHead>
            <TableHead>Actual</TableHead>
            <TableHead>Variance</TableHead>
            <TableHead>Deposit due</TableHead>
            <TableHead>Lead time</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Update</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const estimate = Number(item.estimate);
            const actual = Number(item.actual);
            const variance = actual - estimate;

            return (
              <TableRow key={item.id}>
                <TableCell className="min-w-[260px]">
                  <p className="font-medium">{item.lineItem}</p>
                  <p className="text-xs text-muted-foreground">{item.category.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{item.priority}</Badge>
                    <Badge variant="secondary">{item.openingPriority.replaceAll("_", " ")}</Badge>
                    {item.isPdfPlaceholder ? <Badge variant="warning">Quote placeholder</Badge> : null}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(estimate)}</TableCell>
                <TableCell>{formatCurrency(actual)}</TableCell>
                <TableCell className={variance > 0 ? "text-danger" : "text-success"}>
                  {formatCurrency(variance)}
                </TableCell>
                <TableCell>{formatDate(item.depositDue)}</TableCell>
                <TableCell>{item.leadTimeDays ? `${item.leadTimeDays} days` : "N/A"}</TableCell>
                <TableCell>{item.responsibleOwner?.name ?? "Unassigned"}</TableCell>
                <TableCell className="min-w-[280px]">
                  <form action={updateBudgetItemAction} className="grid gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <Input
                      defaultValue={actual}
                      disabled={currentRole !== Role.OWNER_ADMIN}
                      name="actual"
                      step="0.01"
                      type="number"
                    />
                    <Input
                      defaultValue={item.vendor ?? ""}
                      disabled={currentRole !== Role.OWNER_ADMIN}
                      name="vendor"
                      placeholder="Vendor"
                    />
                    <Select
                      defaultValue={item.paidStatus}
                      disabled={currentRole !== Role.OWNER_ADMIN}
                      name="paidStatus"
                    >
                      <option value="NOT_PAID">Not paid</option>
                      <option value="DEPOSIT_DUE">Deposit due</option>
                      <option value="PARTIALLY_PAID">Partially paid</option>
                      <option value="PAID">Paid</option>
                    </Select>
                    <Input
                      defaultValue={item.notes ?? ""}
                      disabled={currentRole !== Role.OWNER_ADMIN}
                      name="notes"
                      placeholder="Notes"
                    />
                    <Button disabled={currentRole !== Role.OWNER_ADMIN} type="submit">
                      Save
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {currentRole !== Role.OWNER_ADMIN ? (
        <p className="text-sm text-muted-foreground">
          Collaborators can review budget lines, but actuals and payment status remain owner-admin actions.
        </p>
      ) : null}
    </div>
  );
}
