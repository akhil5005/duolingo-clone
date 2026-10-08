"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.desktopOnly);

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-0 right-0 z-30 flex border-t-2 border-line bg-surface md:hidden"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className={clsx(
              "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wide",
              active ? "text-info" : "text-muted",
            )}
          >
            <Icon size={26} strokeWidth={2.5} aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}
