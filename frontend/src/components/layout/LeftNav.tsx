"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Wordmark } from "@/components/layout/Wordmark";

export function LeftNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="sticky top-0 hidden h-screen shrink-0 flex-col gap-2 border-r-2 border-line bg-surface px-3 py-6 md:flex lg:w-64 lg:px-4"
    >
      <Link href="/learn" className="mb-6 hidden px-2 lg:block">
        <Wordmark />
      </Link>

      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex items-center gap-4 rounded-xl border-2 px-3 py-3 text-sm uppercase tracking-wide transition",
              active
                ? "border-info/40 bg-info/10 text-info"
                : "border-transparent text-ink hover:bg-ink/5",
            )}
          >
            <Icon size={28} strokeWidth={2.5} aria-hidden />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
