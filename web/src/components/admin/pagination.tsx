import Link from "next/link";
import { ChevronLeft, ChevronRight } from "./icons";
import { btn } from "./styles";

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

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  href,
  noun = "items",
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  href: (page: number) => string;
  noun?: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">
        Showing <strong className="text-ink">{from}-{to}</strong> of {total} {noun}
      </p>
      {pages > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            {page > 1 ? (
              <Link href={href(page - 1)} className={btn.icon} aria-label="Previous page"><ChevronLeft width={16} height={16} /></Link>
            ) : (
              <span className={`${btn.icon} opacity-40`} aria-hidden="true"><ChevronLeft width={16} height={16} /></span>
            )}
          </li>
          {pageList(page, pages).map((p, i) =>
            p === "gap" ? (
              <li key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">…</li>
            ) : (
              <li key={p}>
                <Link
                  href={href(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                    p === page ? "bg-ink text-white" : "text-muted ring-1 ring-border hover:text-primary"
                  }`}
                >
                  {p}
                </Link>
              </li>
            ),
          )}
          <li>
            {page < pages ? (
              <Link href={href(page + 1)} className={btn.icon} aria-label="Next page"><ChevronRight width={16} height={16} /></Link>
            ) : (
              <span className={`${btn.icon} opacity-40`} aria-hidden="true"><ChevronRight width={16} height={16} /></span>
            )}
          </li>
        </ul>
      )}
    </nav>
  );
}
