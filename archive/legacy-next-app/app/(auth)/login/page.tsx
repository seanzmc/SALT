import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams
}: {
  searchParams: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams.callbackUrl || "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
