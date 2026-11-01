import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { getPricing } from "@/lib/api/client";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("system");
  return { title: t("title") };
}

export default async function SystemPage() {
  const locale = await getLocale();
  const [pricing, t, format] = await Promise.all([
    getPricing(locale),
    getTranslations(),
    getFormatter(),
  ]);

  return (
    <>
      <PageHeader eyebrow="SYSTEM" title={t("system.title")} lead={t("system.lead")} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {pricing.categories.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-surface py-10 text-center text-sm text-muted">
            {t("system.empty")}
          </p>
        )}

        {pricing.categories.map((category) => (
          <section
            key={category.id}
            aria-labelledby={`cat-${category.id}`}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          >
            <div className="bg-blush flex items-center gap-3 border-b border-border px-5 py-4">
              <span aria-hidden="true" className="bg-brand-gradient h-6 w-1.5 rounded-full" />
              <h2 id={`cat-${category.id}`} className="text-lg font-bold text-primary">
                {category.title}
              </h2>
            </div>
            <ul className="divide-y divide-border">
              {category.entries.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{entry.serviceLabel}</p>
                    {entry.description && <p className="mt-0.5 text-xs text-muted">{entry.description}</p>}
                  </div>
                  <p className="shrink-0 font-display text-lg font-bold text-primary tabular-nums md:text-xl">
                    {entry.amount === 0
                      ? t("system.free")
                      : format.number(entry.amount, {
                          style: "currency",
                          currency: entry.currency,
                          currencyDisplay: "narrowSymbol",
                          maximumFractionDigits: 0,
                        })}
                  </p>
                </li>
              ))}
            </ul>
            {category.note && (
              <p className="border-t border-border bg-surface-2/50 px-5 py-3 text-xs text-muted">※ {category.note}</p>
            )}
          </section>
        ))}

        {pricing.footnote && <p className="text-center text-xs text-muted">※ {pricing.footnote}</p>}
      </div>
    </>
  );
}
