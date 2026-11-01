import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch } from "@/lib/admin/api";
import { ADMIN_LOCALES, LOCALE_LABEL, type PageRow } from "@/lib/admin/types";
import { Card, PageHeader, PageStatusBadge, formatDateTime } from "@/components/admin/ui";
import { PAGE_NAMES } from "./page-names";

export const metadata: Metadata = { title: "Pages" };


export default async function PagesPage() {
  const pages = await adminFetch<PageRow[]>("/pages");
  return (
    <>
      <PageHeader
        title="Pages"
        description="Each language is written and published on its own. A page that is not published in a language is not shown in that language (no English fallback)."
      />
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-surface-2/40 text-left text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="px-5 py-3 font-semibold">Page</th>
                {ADMIN_LOCALES.map((l) => (
                  <th key={l} scope="col" className="px-4 py-3 font-semibold">{LOCALE_LABEL[l]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pages.map((p) => (
                <tr key={p.slug}>
                  <th scope="row" className="px-5 py-4 text-left">
                    <p className="font-semibold text-ink">{PAGE_NAMES[p.slug]?.name ?? p.slug}</p>
                    <p className="text-xs font-normal text-muted">{PAGE_NAMES[p.slug]?.note}</p>
                  </th>
                  {ADMIN_LOCALES.map((l) => {
                    const doc = p.locales[l];
                    return (
                      <td key={l} className="px-4 py-4">
                        <Link
                          href={`/admin/pages/${p.slug}/${l}`}
                          className="group block rounded-xl border border-transparent p-2 -m-2 hover:border-border hover:bg-surface-2/30"
                        >
                          <PageStatusBadge value={doc?.status ?? null} />
                          <p className="mt-1 truncate text-xs text-ink group-hover:text-primary">{doc?.title || "Write this page"}</p>
                          {doc && (
                            <p className="text-[11px] text-muted">
                              {formatDateTime(doc.updatedAt)}
                              {doc.lastEditedBy ? ` · ${doc.lastEditedBy}` : ""}
                            </p>
                          )}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
