import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminApiError, adminFetch } from "@/lib/admin/api";
import { savePage } from "@/lib/admin/actions/pages";
import { ADMIN_LOCALES, LOCALE_LABEL, type AdminLocale, type PageDoc } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { ChevronLeft, ExternalIcon } from "@/components/admin/icons";
import { CountedInput, MarkdownEditor } from "@/components/admin/markdown-editor";
import { btn, input } from "@/components/admin/styles";
import { Card, Field, PageHeader, PageStatusBadge, formatDateTime } from "@/components/admin/ui";
import { PAGE_NAMES } from "../../page-names";

export const metadata: Metadata = { title: "Edit page" };

const PUBLIC_PATH: Record<string, string> = {
  home: "",
  access: "/access",
  recruit: "/recruit",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  notices: "/notices",
};

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[slug]/[locale]">) {
  const { slug, locale } = await params;
  if (!ADMIN_LOCALES.includes(locale as AdminLocale)) notFound();
  let page: PageDoc;
  try {
    page = await adminFetch<PageDoc>(`/pages/${encodeURIComponent(slug)}/${locale}`);
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 404) notFound();
    throw e;
  }
  const name = PAGE_NAMES[slug]?.name ?? slug;
  const publicUrl = `/${locale.toLowerCase()}${PUBLIC_PATH[slug] ?? ""}`;

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/pages" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary">
            <ChevronLeft width={16} height={16} /> Pages
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {name}
            <PageStatusBadge value={page.exists ? page.status : null} />
          </span>
        }
        description={
          page.updatedAt
            ? `Last saved ${formatDateTime(page.updatedAt)}${page.lastEditedBy ? ` by ${page.lastEditedBy}` : ""}`
            : "Not written in this language yet."
        }
        actions={
          page.status === "PUBLISHED" && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
              <ExternalIcon width={15} height={15} /> View live
            </a>
          )
        }
      />

      <nav aria-label="Language" className="mb-4 flex flex-wrap gap-2">
        {ADMIN_LOCALES.map((l) => (
          <Link
            key={l}
            href={`/admin/pages/${slug}/${l}`}
            aria-current={l === locale ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              l === locale ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-border hover:text-primary"
            }`}
          >
            {LOCALE_LABEL[l]}
          </Link>
        ))}
      </nav>

      <ActionForm key={locale} action={savePage.bind(null, slug, locale)} className="space-y-6">
        <Card>
          <div className="space-y-5">
            <Field label="Title" htmlFor="title">
              <input id="title" name="title" lang={locale} defaultValue={page.title} maxLength={200} className={`${input} text-base font-semibold`} />
            </Field>
            <MarkdownEditor name="body" initial={page.body} lang={locale} />
          </div>
        </Card>
        <Card title="Search engines" description="Shown in search results and browser tabs for this language.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SEO title" htmlFor="seoTitle">
              <CountedInput id="seoTitle" name="seoTitle" initial={page.seoTitle} recommended={60} max={200} />
            </Field>
            <Field label="Meta description" htmlFor="metaDescription">
              <CountedInput id="metaDescription" name="metaDescription" initial={page.metaDescription} recommended={155} max={320} />
            </Field>
          </div>
        </Card>
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-border/70 bg-white/95 p-3 shadow-lg backdrop-blur">
          <p className="mr-auto text-xs text-muted">
            Publishing affects <strong>{LOCALE_LABEL[locale as AdminLocale]}</strong> only.
          </p>
          <SubmitButton variant="secondary" name="status" value="DRAFT">
            {page.status === "PUBLISHED" ? "Unpublish (save as draft)" : "Save draft"}
          </SubmitButton>
          <SubmitButton name="status" value="PUBLISHED">
            {page.status === "PUBLISHED" ? "Update published page" : "Publish"}
          </SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
