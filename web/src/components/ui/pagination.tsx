import type { ComponentProps } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

/** Page numbers with gaps: 1 … 4 5 6 … 12 */
function pageList(page: number, pages: number) {
  const keep = new Set([1, pages, page - 1, page, page + 1]);
  const list: (number | "gap")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (keep.has(p)) list.push(p);
    else if (list.at(-1) !== "gap") list.push("gap");
  }
  return list;
}

const arrow =
  "inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors";

/** Numbered page links; `href` builds the link for a page (keeping any filters). */
export async function Pagination({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (page: number) => ComponentProps<typeof Link>["href"];
}) {
  if (pages <= 1) return null;
  const t = await getTranslations("pagination");

  return (
    <nav aria-label={t("label")} className="flex justify-center">
      <ul className="flex items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label={t("previous")} className={`${arrow} hover:text-primary`}>
              <ChevronLeftIcon width={16} height={16} />
            </Link>
          ) : (
            <span className={`${arrow} opacity-40`} aria-hidden="true">
              <ChevronLeftIcon width={16} height={16} />
            </span>
          )}
        </li>
        {pageList(page, pages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-label={t("page", { page: p })}
                aria-current={p === page ? "page" : undefined}
                className={`inline-flex size-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  p === page
                    ? "bg-brand-gradient text-white shadow"
                    : "border border-border bg-surface text-muted hover:text-primary"
                }`}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pages ? (
            <Link href={href(page + 1)} aria-label={t("next")} className={`${arrow} hover:text-primary`}>
              <ChevronRightIcon width={16} height={16} />
            </Link>
          ) : (
            <span className={`${arrow} opacity-40`} aria-hidden="true">
              <ChevronRightIcon width={16} height={16} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
