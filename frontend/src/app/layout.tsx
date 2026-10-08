import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme-mode";
import "@/styles/globals.css";

// Nunito is a free rounded-bold family; it stands in for Duolingo's own
// proprietary typeface, which is not redistributable.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "lingoleap - learn a language, one leap at a time",
  description:
    "A gamified language learning app: follow a skill path, play through lessons and keep your streak alive.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before the first paint; see lib/theme-mode. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
