"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavEntry {
  href: string;
  label: string;
  icon: ReactNode;
}

/** Sidebar link list with the current section highlighted. */
export function NavLinks({ items, onNavigate }: { items: NavEntry[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-white shadow-[0_6px_16px_-6px_rgba(200,29,92,0.8)]"
                  : "text-night-ink/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={active ? "text-white" : "text-primary-soft"}>{item.icon}</span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phone-width menu: a disclosure that closes after navigating. */
export function MobileNav({ children }: { children: ReactNode }) {
  return (
    <details className="group lg:hidden [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm font-semibold text-night-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        Menu
      </summary>
      <div
        className="absolute inset-x-0 top-full z-40 border-b border-white/10 bg-night px-4 pb-4 pt-2 shadow-xl"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) {
            (e.currentTarget.parentElement as HTMLDetailsElement).open = false;
          }
        }}
      >
        {children}
      </div>
    </details>
  );
}
