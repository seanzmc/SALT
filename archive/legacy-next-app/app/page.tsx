import { redirect } from "next/navigation";

import { getRequiredSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getRequiredSession();

  redirect(session?.user ? "/dashboard" : "/login");
}
