import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/api";
import type { AuditPage } from "@/lib/admin/types";
import { describeAction } from "@/components/admin/audit-label";
import { btn } from "@/components/admin/styles";
import { Card, PageHeader, formatDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Activity log" };

const PAGE_SIZE = 50;

export default async function AuditLogPage({ searchParams }: PageProps<"/admin/audit">) {
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof raw === "string" ? raw : "1", 10) || 1);
  const log = await adminFetch<AuditPage>(`/audit?page=${page}&pageSize=${PAGE_SIZE}`);
  const pages = Math.max(1, Math.ceil(log.total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Who changed what and when (CMS-08). Records identifiers only, never content or passwords. Times are Japan time."
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-surface-2/40 text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-semibold">When</th>
                <th scope="col" className="px-3 py-3 font-semibold">Who</th>
                <th scope="col" className="px-3 py-3 font-semibold">What</th>
                <th scope="col" className="px-5 py-3 font-semibold">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {log.entries.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-5 py-2.5 text-muted">{formatDateTime(e.occurredAt)}</td>
                  <td className="px-3 py-2.5 font-medium text-ink">{e.actor ?? "deleted user"}</td>
                  <td className="px-3 py-2.5 text-ink">{describeAction(e.action)}</td>
                  <td className="px-5 py-2.5 font-mono text-[11px] text-muted">
                    {e.objectType} {e.objectId === "*" ? "(all)" : e.objectId.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>
          {log.total} entries · page {page} of {pages}
        </span>
        <div className="flex gap-2">
          {page > 1 && <Link href={`/admin/audit?page=${page - 1}`} className={btn.small}>Newer</Link>}
          {page < pages && <Link href={`/admin/audit?page=${page + 1}`} className={btn.small}>Older</Link>}
        </div>
      </div>
    </>
  );
}
