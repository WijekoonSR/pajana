import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api/client";
import type { PageSlug } from "@/lib/api/types";
import { Markdown } from "./markdown";
import { PageHeader } from "./page-header";

/** CMS-only page; 404 when not published in this locale (SRS 07). */
export async function LegalPage({ slug, eyebrow }: { slug: PageSlug; eyebrow: string }) {
  const page = await getPage(await getLocale(), slug);
  if (!page) notFound();
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={page.title} />
      <article className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-10">
          <Markdown>{page.body}</Markdown>
        </div>
      </article>
    </>
  );
}
