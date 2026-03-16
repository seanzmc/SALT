"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Role } from "@prisma/client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "U";
}

export function AccountMenu({
  name,
  role,
  showOperationalSetup
}: {
  name: string;
  role: Role;
  showOperationalSetup: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initials = useMemo(() => getInitials(name), [name]);
  const roleLabel = role === Role.OWNER_ADMIN ? "Owner Admin" : "Collaborator";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-foreground shadow-sm transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {initials}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-border bg-white p-3 shadow-lg">
          <div className="px-1 pb-2">
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{roleLabel}</p>
          </div>
          <Separator className="mb-3" />
          <div className="space-y-2">
            {showOperationalSetup ? (
              <Link
                className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}
                href="/settings/setup"
                onClick={() => setIsOpen(false)}
              >
                Operational setup
              </Link>
            ) : null}
            <Link
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}
              href="/settings/account"
              onClick={() => setIsOpen(false)}
            >
              Account settings
            </Link>
            <Button
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: "/login" })}
              type="button"
              variant="ghost"
            >
              Sign out
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
