"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { NavLink } from "./nav-link";

interface MenuItem {
  key: string;
  href: string;
  title: string;
  sub: string;
}

export function MobileMenu({ items }: { items: MenuItem[] }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-full bg-primary text-white shadow-md shadow-primary/30"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Portal: the header's backdrop-filter would otherwise trap fixed children. */}
      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-50 bg-night/40 pt-20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <nav
            id={panelId}
            aria-label={t("mainNav")}
            onClick={(e) => e.stopPropagation()}
            className="bg-blush mx-3 rounded-3xl border border-border bg-surface p-3 shadow-xl"
          >
            <ul className="grid grid-cols-2 gap-2">
              {items.map((item) => (
                <li key={item.key}>
                  <NavLink
                    href={item.href}
                    onNavigate={() => setOpen(false)}
                    className="flex flex-col rounded-2xl border border-border bg-surface/80 px-4 py-3 transition-colors hover:border-primary"
                    activeClassName="border-primary bg-surface-2"
                  >
                    <span className="font-display text-sm font-bold tracking-[0.16em] text-primary">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted">{item.sub}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>,
          document.body,
        )}
    </div>
  );
}
