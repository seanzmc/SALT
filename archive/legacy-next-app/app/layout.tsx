import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/components/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "SALT",
    template: "%s | SALT"
  },
  description:
    "Skin And Laser Treatment internal operations platform for planning, budgeting, documenting, and coordinating clinic work."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
