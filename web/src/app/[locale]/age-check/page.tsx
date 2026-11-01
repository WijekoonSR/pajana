import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getPathname } from "@/i18n/navigation";
import { getSettings } from "@/lib/api/client";
import { BrandMark } from "@/components/layout/brand-mark";
import { acknowledgeAge } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ageGate");
  return { title: t("notice") };
}

/**
 * WEB-01 age gate. Covers the whole viewport; "Leave" never sets the cookie.
 * Wording comes from the CMS and still needs legal approval (UAT-08).
 */
export default async function AgeCheckPage({ searchParams }: PageProps<"/[locale]/age-check">) {
  const locale = await getLocale();
  const [settings, t] = await Promise.all([getSettings(locale), getTranslations("ageGate")]);
  const gate = settings.ageGate;

  return (
    <div className="age-gate bg-blush fixed inset-0 z-[60] overflow-y-auto bg-bg">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 text-center shadow-2xl shadow-primary/20 md:p-10">
          <BrandMark title={settings.siteTitle} tagline={settings.tagline} size="lg" />
          <div className="bg-brand-gradient mx-auto mt-6 grid size-16 place-items-center rounded-full text-xl font-black text-white shadow-lg shadow-primary/30">
            18+
          </div>
          <h1 className="mt-5 text-xl font-bold text-ink">{gate.title || t("notice")}</h1>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{gate.body}</p>

          <form action={acknowledgeAge} className="mt-7 space-y-3">
            <input type="hidden" name="home" value={getPathname({ href: "/", locale })} />
            <Suspense fallback={null}>
              <NextField searchParams={searchParams} />
            </Suspense>
            <button
              type="submit"
              className="bg-brand-gradient w-full rounded-full px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5"
            >
              {gate.enterLabel || t("enter")}
            </button>
          </form>
          <a
            href={gate.leaveUrl}
            rel="noreferrer"
            className="mt-3 block w-full rounded-full border-2 border-border px-6 py-3 text-sm font-bold text-muted transition-colors hover:border-ink hover:text-ink"
          >
            {gate.leaveLabel || t("leave")}
          </a>
        </div>
      </div>
    </div>
  );
}

async function NextField({ searchParams }: { searchParams: PageProps<"/[locale]/age-check">["searchParams"] }) {
  const { next } = await searchParams;
  return typeof next === "string" ? <input type="hidden" name="next" value={next} /> : null;
}
