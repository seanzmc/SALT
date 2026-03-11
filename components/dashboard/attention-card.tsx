import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AttentionItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
};

export function AttentionCard({
  title,
  count,
  href,
  linkLabel,
  secondaryHref,
  secondaryLinkLabel,
  detail,
  items,
  breakdown
}: {
  title: string;
  count: number;
  href: string;
  linkLabel: string;
  secondaryHref?: string;
  secondaryLinkLabel?: string;
  detail: string;
  items?: AttentionItem[];
  breakdown?: Array<{ label: string; value: number }>;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
          </div>
          <Badge variant={count > 0 ? "warning" : "outline"}>{count}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")} href={href}>
            {linkLabel}
          </Link>
          {secondaryHref && secondaryLinkLabel ? (
            <Link
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
              href={secondaryHref}
            >
              {secondaryLinkLabel}
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-lg border border-border p-3 hover:bg-muted/60"
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
        )}

        {breakdown && breakdown.length > 0 ? (
          <div className="space-y-2 border-t border-border pt-3">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
