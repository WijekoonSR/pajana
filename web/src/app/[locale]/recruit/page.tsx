import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPage, getSettings } from "@/lib/api/client";
import { cmsPageMetadata } from "@/lib/page-meta";
import { ContactButtons } from "@/components/ui/contact-buttons";
import { Markdown } from "@/components/ui/markdown";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("recruit");
  return cmsPageMetadata("recruit", t("title"));
}

// No application form in beta (SRS WEB-07 / WEB-11); contact instructions only.
export default async function RecruitPage() {
  const locale = await getLocale();
  const [settings, page, t] = await Promise.all([
    getSettings(locale),
    getPage(locale, "recruit"),
    getTranslations("recruit"),
  ]);

  return (
    <>
      <PageHeader eyebrow="RECRUIT" title={page?.title ?? t("title")} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {page?.body && (
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-10">
            <Markdown>{page.body}</Markdown>
          </div>
        )}
        <ContactButtons channels={settings.contactChannels} />
      </div>
    </>
  );
}
