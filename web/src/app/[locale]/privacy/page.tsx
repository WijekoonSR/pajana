import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cmsPageMetadata } from "@/lib/page-meta";
import { LegalPage } from "@/components/ui/legal-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("footer");
  return cmsPageMetadata("privacy", t("privacy"));
}

export default function Page() {
  return <LegalPage slug="privacy" eyebrow="PRIVACY" />;
}
