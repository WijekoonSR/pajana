import Link from "next/link";
import type { ReactNode } from "react";
import { getAdmin } from "@/lib/admin/api";
import { logout } from "@/lib/admin/actions/auth";
import {
  CalendarIcon,
  DashboardIcon,
  ExternalIcon,
  HistoryIcon,
  KeyIcon,
  LogoutIcon,
  PageIcon,
  ProfileIcon,
  SettingsIcon,
  ShieldIcon,
  YenIcon,
} from "./icons";
import { MobileNav, NavLinks, type NavEntry } from "./nav";
import { ToastProvider } from "./toast";

const CONTENT: NavEntry[] = [
  { href: "/admin", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/admin/profiles", label: "Profiles", icon: <ProfileIcon /> },
  { href: "/admin/schedule", label: "Schedule", icon: <CalendarIcon /> },
  { href: "/admin/pricing", label: "Pricing", icon: <YenIcon /> },
  { href: "/admin/pages", label: "Pages", icon: <PageIcon /> },
  { href: "/admin/settings", label: "Site settings", icon: <SettingsIcon /> },
];

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2">
      <span className="text-brand-gradient font-brand text-xl font-black tracking-[0.12em]">粉色誘惑</span>
      <span aria-hidden="true">🫦</span>
      <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-soft">
        CMS
      </span>
    </Link>
  );
}

function Sections({ isOwner }: { isOwner: boolean }) {
  const admin: NavEntry[] = [
    ...(isOwner ? [{ href: "/admin/users", label: "Admin users", icon: <ShieldIcon /> }] : []),
    { href: "/admin/audit", label: "Activity log", icon: <HistoryIcon /> },
    { href: "/admin/account", label: "My account", icon: <KeyIcon /> },
  ];
  return (
    <nav aria-label="Admin" className="space-y-6">
      <div>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-night-ink/40">Content</p>
        <NavLinks items={CONTENT} />
      </div>
      <div>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-night-ink/40">Administration</p>
        <NavLinks items={admin} />
      </div>
    </nav>
  );
}

function UserBox({ login, role }: { login: string; role: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold uppercase text-white">
        {login.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{login}</p>
        <p className="text-[11px] uppercase tracking-wider text-night-ink/50">{role.toLowerCase()}</p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="rounded-full p-2 text-night-ink/70 hover:bg-white/10 hover:text-white"
        >
          <LogoutIcon />
        </button>
      </form>
    </div>
  );
}

/** Signed-in chrome: sidebar on desktop, top bar with a menu on phones. */
export async function AdminShell({ children }: { children: ReactNode }) {
  const admin = await getAdmin();
  const isOwner = admin.role === "OWNER";
  return (
    <ToastProvider>
      <div className="min-h-svh bg-[#fbf6f8] lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:gap-6 lg:overflow-y-auto lg:bg-night lg:px-4 lg:py-6">
          <div className="px-3">
            <Brand />
          </div>
          <div className="flex-1">
            <Sections isOwner={isOwner} />
          </div>
          <a
            href="/en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 text-xs font-medium text-night-ink/60 hover:text-white"
          >
            <ExternalIcon width={14} height={14} /> View public site
          </a>
          <UserBox login={admin.login} role={admin.role} />
        </aside>

        <header className="relative flex items-center justify-between gap-3 bg-night px-4 py-3 lg:hidden">
          <Brand />
          <MobileNav>
            <Sections isOwner={isOwner} />
            <div className="mt-4">
              <UserBox login={admin.login} role={admin.role} />
            </div>
          </MobileNav>
        </header>

        <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}

export function ShellSkeleton() {
  return (
    <div className="min-h-svh bg-[#fbf6f8] lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden bg-night lg:block" />
      <div className="bg-night px-4 py-5 lg:hidden" />
      <div className="px-4 py-10 lg:px-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-border/60" />
          <div className="h-40 rounded-2xl bg-white" />
          <div className="h-64 rounded-2xl bg-white" />
        </div>
      </div>
    </div>
  );
}
