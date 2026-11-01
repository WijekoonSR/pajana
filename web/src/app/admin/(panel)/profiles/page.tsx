import type { Metadata } from "next";
import Link from "next/link";
import { adminFetch, mediaUrl } from "@/lib/admin/api";
import { moveProfile } from "@/lib/admin/actions/profiles";
import type { ProfilePage, ProfileTab } from "@/lib/admin/types";
import { ActionButton } from "@/components/admin/action-form";
import { DownIcon, PlusIcon, UpIcon } from "@/components/admin/icons";
import { Pagination } from "@/components/admin/pagination";
import { btn, input } from "@/components/admin/styles";
import {
  Badge,
  Card,
  EmptyState,
  MissingLocales,
  PageHeader,
  Thumb,
  VisibilityBadge,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "Profiles" };

const PAGE_SIZE = 10;

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "active", label: "All active" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "hidden", label: "Hidden" },
  { key: "archived", label: "Archived" },
];

export default async function ProfilesPage({ searchParams }: PageProps<"/admin/profiles">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const tab = TABS.find((t) => t.key === str("status"))?.key ?? "active";
  const q = str("q").trim().slice(0, 80);
  const requested = Math.max(1, Number.parseInt(str("page"), 10) || 1);

  const query = (page: number) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), status: tab });
    if (q) params.set("q", q);
    return params;
  };
  let data = await adminFetch<ProfilePage>(`/profiles?${query(requested)}`);
  // A page past the end (e.g. after archiving the last item) shows the last page.
  if (requested > data.pages) data = await adminFetch<ProfilePage>(`/profiles?${query(data.pages)}`);

  const href = (patch: { status?: ProfileTab; page?: number }) => {
    const params = new URLSearchParams();
    const status = patch.status ?? tab;
    if (status !== "active") params.set("status", status);
    if (q) params.set("q", q);
    const page = patch.page ?? 1;
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/admin/profiles?${qs}` : "/admin/profiles";
  };
  // Moving changes the public order, so it is offered on the unfiltered active list only.
  const canReorder = tab === "active" && !q;
  const first = (data.page - 1) * data.pageSize;

  return (
    <>
      <PageHeader
        title="Profiles"
        description="Cast list and profile pages. Only published profiles appear on the public site, in this order."
        actions={
          <Link href="/admin/profiles/new" className={btn.primary}>
            <PlusIcon /> New profile
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter profiles" className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Link
                key={t.key}
                href={href({ status: t.key })}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  active ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-border hover:text-primary"
                }`}
              >
                {t.label} <span className="ml-1 opacity-60">{data.counts[t.key]}</span>
              </Link>
            );
          })}
        </nav>
        <form action="/admin/profiles" className="flex gap-2">
          {tab !== "active" && <input type="hidden" name="status" value={tab} />}
          <label htmlFor="profile-search" className="sr-only">Search profiles</label>
          <input
            id="profile-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name or slug…"
            className={`${input} w-full! lg:w-64!`}
          />
          <button type="submit" className={btn.secondary}>Search</button>
          {q && <Link href={href({})} className={btn.ghost}>Clear</Link>}
        </form>
      </div>

      {data.items.length === 0 ? (
        <EmptyState title={q ? `No profiles match "${q}"` : "No profiles here"}>
          {q ? "Try another name, or clear the search." : "Create one, or check another filter."}
        </EmptyState>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-border/60">
            {data.items.map((p, i) => {
              const position = first + i;
              return (
                <li key={p.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                  {canReorder && (
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-right text-xs font-semibold tabular-nums text-muted">{position + 1}</span>
                      <div className="flex flex-col gap-1">
                        {position > 0 ? (
                          <ActionButton action={moveProfile.bind(null, p.id, "up")} variant="icon" label={`Move ${p.displayName.en} up`}>
                            <UpIcon width={14} height={14} />
                          </ActionButton>
                        ) : (
                          <span className="h-8 w-8" />
                        )}
                        {position < data.total - 1 ? (
                          <ActionButton action={moveProfile.bind(null, p.id, "down")} variant="icon" label={`Move ${p.displayName.en} down`}>
                            <DownIcon width={14} height={14} />
                          </ActionButton>
                        ) : (
                          <span className="h-8 w-8" />
                        )}
                      </div>
                    </div>
                  )}
                  <Link href={`/admin/profiles/${p.id}`} className="shrink-0">
                    <Thumb
                      src={p.thumbnail ? mediaUrl(p.thumbnail) : null}
                      alt=""
                      width={48}
                      height={64}
                      className="h-16 w-12 rounded-lg"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/profiles/${p.id}`} className="font-semibold text-ink hover:text-primary">
                      {p.displayName.en || p.slug}
                      <span className="ml-2 font-normal text-muted">
                        {[p.displayName["zh-TW"], p.displayName["zh-CN"]].filter(Boolean).join(" / ")}
                      </span>
                    </Link>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted">/{p.slug}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <VisibilityBadge value={p.visibility} />
                      {p.isNew && <Badge tone="pink">New</Badge>}
                      <MissingLocales locales={p.missingLocales} />
                    </div>
                  </div>
                  <div className="hidden text-right text-xs text-muted sm:block">
                    <p>{p.mediaCount} images</p>
                    <p>{p.slotCount} slots</p>
                  </div>
                  <Link href={`/admin/profiles/${p.id}`} className={btn.small}>
                    Edit
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Pagination
        page={data.page}
        pages={data.pages}
        total={data.total}
        pageSize={data.pageSize}
        href={(page) => href({ page })}
        noun="profiles"
      />
    </>
  );
}
