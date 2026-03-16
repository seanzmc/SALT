import { PageHeader } from "@/components/layout/page-header";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/server/authz";

export default async function AccountSettingsPage() {
  const session = await requireOwner();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true }
  });

  if (!user) {
    throw new Error("Owner account not found.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account settings"
        description="Manage the current owner account credentials used to access this protected workspace."
      />
      <AccountSettingsForm currentEmail={user.email} />
    </div>
  );
}
