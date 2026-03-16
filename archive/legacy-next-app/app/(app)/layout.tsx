import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { requireSession } from "@/server/authz";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen xl:flex">
      <Sidebar />
      <div className="flex-1">
        <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
          <TopBar name={session.user.name ?? "User"} role={session.user.role} />
          {children}
        </main>
      </div>
    </div>
  );
}
