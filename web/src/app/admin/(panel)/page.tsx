import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch, getAdmin } from "@/lib/admin/api";
import type { Dashboard } from "@/lib/admin/types";
import { Badge, Card, PageHeader, formatDateTime } from "@/components/admin/ui";
import { btn } from "@/components/admin/styles";
import { CalendarIcon, ImageIcon, PageIcon, PlusIcon, ProfileIcon } from "@/components/admin/icons";
import { describeAction } from "@/components/admin/audit-label";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [admin, d] = await Promise.all([getAdmin(), adminFetch<Dashboard>("/dashboard")]);
  const published = d.profiles.PUBLISHED ?? 0;
  const unpublished = (d.profiles.DRAFT ?? 0) + (d.profiles.HIDDEN ?? 0);

  const stats = [
    { label: "Published profiles", value: published, note: `${unpublished} draft or hidden`, href: "/admin/profiles", icon: <ProfileIcon /> },
    { label: "On shift today", value: d.todaySlots, note: `Tokyo, ${d.today}`, href: "/admin/schedule", icon: <CalendarIcon /> },
    { label: "Draft pages", value: d.draftPages, note: "Not visible in that language", href: "/admin/pages", icon: <PageIcon /> },
    { label: "Images", value: d.mediaCount, note: "Cast photos", href: "/admin/profiles", icon: <ImageIcon /> },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${admin.login}`}
        description="Manage the international site in English, Traditional Chinese (Taiwan) and Simplified Chinese."
        actions={
          <>
            <Link href="/admin/schedule" className={btn.secondary}>
              <CalendarIcon /> Edit schedule
            </Link>
            <Link href="/admin/profiles/new" className={btn.primary}>
              <PlusIcon /> New profile
            </Link>
          </>
        }
      />

      {admin.login === "admin" && (
        <div className="mb-6 space-y-2">
          {admin.login === "admin" && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <strong>You are using the default staging account.</strong> Create personal accounts and
              disable this one, or <Link href="/admin/account" className="underline">change its password</Link>, before any public release.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-border/70 bg-white p-5 shadow-[0_1px_2px_rgba(42,14,28,0.04)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</p>
              <span className="rounded-full bg-surface-2 p-2 text-primary">{s.icon}</span>
            </div>
            <p className="mt-3 font-display text-4xl font-bold text-ink">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Recent activity"
          actions={<Link href="/admin/audit" className={btn.ghost}>View all</Link>}
          padded={false}
        >
          <ul className="divide-y divide-border/60">
            {d.recentActivity.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{describeAction(e.action)}</p>
                  <p className="text-xs text-muted">{e.actor ?? "system"}</p>
                </div>
                <time className="shrink-0 text-xs text-muted">{formatDateTime(e.occurredAt)}</time>
              </li>
            ))}
            {!d.recentActivity.length && <li className="px-5 py-6 text-sm text-muted">No activity yet.</li>}
          </ul>
        </Card>

        <Card title="Publishing checklist" description="Before public launch (SRS release gates)">
          <ul className="space-y-3 text-sm">
            {[
              ["Every page published in all three languages", d.draftPages === 0],
              ["Default admin account removed", admin.login !== "admin"],
            ].map(([text, done]) => (
              <li key={String(text)} className="flex items-start gap-3">
                <Badge tone={done ? "green" : "amber"}>{done ? "Done" : "To do"}</Badge>
                <span className="text-ink">{text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
