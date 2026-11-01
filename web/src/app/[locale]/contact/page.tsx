import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPage, getSettings } from "@/lib/api/client";
import { cmsPageMetadata } from "@/lib/page-meta";
import { ChannelIcon } from "@/components/ui/icons";
import { Markdown } from "@/components/ui/markdown";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  return cmsPageMetadata("contact", t("title"));
}

// Static contact methods only; forms are P1 pending approval (SRS WEB-08).
export default async function ContactPage() {
  const locale = await getLocale();
  const [settings, page, t] = await Promise.all([
    getSettings(locale),
    getPage(locale, "contact"),
    getTranslations("contact"),
  ]);

  return (
    <>
      <PageHeader eyebrow="CONTACT" title={page?.title ?? t("title")} lead={t("lead")} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <section aria-labelledby="methods">
          <h2 id="methods" className="sr-only">{t("methods")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {settings.contactChannels.map((c, i) => (
              <li key={`${c.type}-${c.value}`}>
                <a
                  href={c.href}
                  className={`flex h-full items-center gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 ${
                    i === 0 ? "bg-brand-gradient border-transparent text-white" : "border-border bg-surface"
                  }`}
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-full ${
                      i === 0 ? "bg-white/20" : "bg-surface-2 text-primary"
                    }`}
                  >
                    <ChannelIcon type={c.type} width={22} height={22} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-xs font-bold ${i === 0 ? "text-white/80" : "text-muted"}`}>
                      {c.label}
                    </span>
                    <span className="block truncate text-lg font-bold">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
        {page?.body && (
          <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
            <Markdown>{page.body}</Markdown>
          </div>
        )}
      </div>
    </>
  );
}
