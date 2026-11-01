import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-brand-gradient font-display text-7xl font-bold">404</p>
      <h1 className="mt-4 text-xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("notFoundBody")}</p>
      <Link href="/" className="bg-brand-gradient mt-8 rounded-full px-6 py-3 text-sm font-bold text-white">
        {t("goHome")}
      </Link>
    </div>
  );
}
