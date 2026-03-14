import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { loginSchema } from "@salt/validation";

import { ApiClientError } from "../../../lib/api-client";
import { loginWithCredentials } from "../api/auth-client";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: loginWithCredentials,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      navigate(redirectTo, { replace: true });
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white/90 p-8 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          SALT Business Planner
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>

        <form
          className="mt-8 space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await loginMutation.mutateAsync(values);
          })}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              type="email"
              {...form.register("email")}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              type="password"
              {...form.register("password")}
            />
          </label>

          {form.formState.errors.email ? (
            <p className="text-sm text-red-700">{form.formState.errors.email.message}</p>
          ) : null}

          {form.formState.errors.password ? (
            <p className="text-sm text-red-700">{form.formState.errors.password.message}</p>
          ) : null}

          {loginMutation.error instanceof ApiClientError ? (
            <p className="text-sm text-red-700">{loginMutation.error.message}</p>
          ) : null}

          <button
            className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium transition hover:text-foreground" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
