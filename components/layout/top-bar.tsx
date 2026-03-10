import { Role } from "@prisma/client";
import Link from "next/link";

import { SignOutButton } from "@/components/layout/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TopBar({
  name,
  role
}: {
  name: string;
  role: Role;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white/85 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Lakeland, Florida
        </p>
        <h2 className="text-xl font-semibold">SALT operations workspace</h2>
      </div>
      <div className="flex items-center gap-3">
        {role === Role.OWNER_ADMIN ? (
          <Link
            href="/settings/account"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Account settings
          </Link>
        ) : null}
        <div className="text-right">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {role === Role.OWNER_ADMIN ? "Owner Admin" : "Collaborator"}
          </p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
