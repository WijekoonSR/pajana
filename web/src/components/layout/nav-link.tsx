"use client";

import { Suspense, type ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";

interface NavLinkProps {
  href: string;
  className: string;
  activeClassName: string;
  children: ReactNode;
  onNavigate?: () => void;
}

function ActiveLink({ href, className, activeClassName, children, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : ""}`}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );
}

/** Highlights the current section; prerenders as a plain link until the path is known. */
export function NavLink(props: NavLinkProps) {
  const { href, className, children, onNavigate } = props;
  return (
    <Suspense
      fallback={
        <Link href={href} className={className} onClick={onNavigate}>
          {children}
        </Link>
      }
    >
      <ActiveLink {...props} />
    </Suspense>
  );
}
