import type { Metadata } from "next";
import { adminFetch } from "@/lib/admin/api";
import {
  deleteCategory,
  deleteEntry,
  moveCategory,
  moveEntry,
  saveCategory,
  saveEntry,
  saveFootnote,
} from "@/lib/admin/actions/pricing";
import { CURRENCIES } from "@/lib/admin/currencies";
import type { PriceCategory, PriceEntry, Pricing } from "@/lib/admin/types";
import { ActionButton, ActionForm, SubmitButton } from "@/components/admin/action-form";
import { DownIcon, TrashIcon, UpIcon } from "@/components/admin/icons";
import { input } from "@/components/admin/styles";
import { Card, EmptyState, Field, LocalizedField, PageHeader, PublishedBadge } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Pricing" };

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export default async function PricingPage() {
  const { categories, footnote } = await adminFetch<Pricing>("/pricing");
  const categoryIds = categories.map((c) => c.id);

  return (
    <>
      <PageHeader
        title="Pricing"
        description="International-site prices only. These are maintained here and are not linked to the Japanese site. No currency conversion is applied."
      />

      <div className="space-y-6">
        {categories.length === 0 && <EmptyState title="No price categories yet">Add the first one below.</EmptyState>}
        {categories.map((c, i) => (
          <Card
            key={c.id}
            title={
              <span className="flex flex-wrap items-center gap-2">
                {c.title.en}
                <span className="font-normal text-muted">{c.title["zh-TW"]}</span>
                <PublishedBadge published={c.published} />
              </span>
            }
            description={c.note.en || undefined}
            actions={
              <>
                <ActionButton action={moveCategory.bind(null, categoryIds, i, -1)} variant="icon" label="Move category up">
                  <UpIcon width={14} height={14} />
                </ActionButton>
                <ActionButton action={moveCategory.bind(null, categoryIds, i, 1)} variant="icon" label="Move category down">
                  <DownIcon width={14} height={14} />
                </ActionButton>
                <ActionButton
                  action={deleteCategory.bind(null, c.id)}
                  variant="smallDanger"
                  confirm={`Delete "${c.title.en}" and its ${c.entries.length} price line(s)?`}
                >
                  Delete
                </ActionButton>
              </>
            }
            padded={false}
          >
            <details className="border-b border-border/60 px-5 py-3">
              <summary className="cursor-pointer text-xs font-semibold text-primary">Edit category</summary>
              <ActionForm action={saveCategory.bind(null, c.id)} className="mt-4 space-y-4">
                <CategoryFields category={c} />
                <SubmitButton variant="small">Save category</SubmitButton>
              </ActionForm>
            </details>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th scope="col" className="px-5 py-2 font-semibold">Service</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Duration</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Price</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {c.entries.map((e, j) => (
                    <EntryRow key={e.id} entry={e} index={j} ids={c.entries.map((x) => x.id)} categories={categories} />
                  ))}
                  {c.entries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-4 text-sm text-muted">No price lines yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <details className="border-t border-border/60 px-5 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-primary">+ Add price line</summary>
              <ActionForm action={saveEntry.bind(null, null)} resetOnSuccess className="mt-4 space-y-4">
                <EntryFields categoryId={c.id} categories={categories} />
                <SubmitButton variant="small">Add price</SubmitButton>
              </ActionForm>
            </details>
          </Card>
        ))}

        <Card title="Add a category" description="For example Courses, Extensions, Options or Transportation fees. New categories start hidden.">
          <ActionForm action={saveCategory.bind(null, null)} resetOnSuccess className="space-y-4">
            <CategoryFields />
            <SubmitButton>Add category</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="Footnote" description="Shown under the price list, e.g. tax and currency notes.">
          <ActionForm action={saveFootnote} className="space-y-4">
            <LocalizedField name="footnote" label="Footnote" value={footnote} multiline rows={2} />
            <SubmitButton>Save footnote</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}

function CategoryFields({ category }: { category?: PriceCategory }) {
  return (
    <>
      <LocalizedField name="title" idPrefix={category?.id ?? "new"} label="Title" value={category?.title} requireEnglish maxLength={80} />
      <LocalizedField name="note" idPrefix={category?.id ?? "new"} label="Note" value={category?.note} maxLength={300} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="published" defaultChecked={category?.published} className="h-4 w-4 accent-primary" />
        Show this category on the public site
      </label>
    </>
  );
}

function EntryFields({
  entry,
  categoryId,
  categories,
}: {
  entry?: PriceEntry;
  categoryId: string;
  categories: PriceCategory[];
}) {
  const uid = entry?.id ?? `new-${categoryId}`;
  return (
    <>
      <LocalizedField name="serviceLabel" idPrefix={uid} label="Service" value={entry?.serviceLabel} requireEnglish maxLength={120} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Amount" htmlFor={`amount-${uid}`}>
          <input id={`amount-${uid}`} name="amount" type="number" min={0} step={1} required defaultValue={entry?.amount} className={input} />
        </Field>
        <Field label="Currency" htmlFor={`currency-${uid}`}>
          <select id={`currency-${uid}`} name="currency" required defaultValue={entry?.currency ?? "JPY"} className={input}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
            {entry && !CURRENCIES.some((c) => c.code === entry.currency) && (
              <option value={entry.currency}>{entry.currency}</option>
            )}
          </select>
        </Field>
        <Field label="Minutes (optional)" htmlFor={`minutes-${uid}`}>
          <input id={`minutes-${uid}`} name="durationMinutes" type="number" min={1} max={1440} defaultValue={entry?.durationMinutes ?? ""} className={input} />
        </Field>
        <Field label="Category" htmlFor={`category-${uid}`}>
          <select id={`category-${uid}`} name="categoryId" defaultValue={entry?.categoryId ?? categoryId} className={input}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.title.en}</option>
            ))}
          </select>
        </Field>
      </div>
      <LocalizedField name="description" idPrefix={uid} label="Description" value={entry?.description} maxLength={300} />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="published" defaultChecked={entry ? entry.published : true} className="h-4 w-4 accent-primary" />
        Show this price publicly
      </label>
    </>
  );
}

function EntryRow({
  entry: e,
  index,
  ids,
  categories,
}: {
  entry: PriceEntry;
  index: number;
  ids: string[];
  categories: PriceCategory[];
}) {
  return (
    <>
      <tr className="align-middle">
        <td className="px-5 py-3">
          <p className="font-semibold text-ink">{e.serviceLabel.en}</p>
          <p className="text-xs text-muted">{[e.serviceLabel["zh-TW"], e.serviceLabel["zh-CN"]].filter(Boolean).join(" / ")}</p>
        </td>
        <td className="px-3 py-3 text-muted">{e.durationMinutes ? `${e.durationMinutes} min` : "-"}</td>
        <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">{formatAmount(e.amount, e.currency)}</td>
        <td className="px-3 py-3"><PublishedBadge published={e.published} /></td>
        <td className="px-5 py-3">
          <div className="flex justify-end gap-1">
            <ActionButton action={moveEntry.bind(null, e.categoryId, ids, index, -1)} variant="icon" label="Move up">
              <UpIcon width={14} height={14} />
            </ActionButton>
            <ActionButton action={moveEntry.bind(null, e.categoryId, ids, index, 1)} variant="icon" label="Move down">
              <DownIcon width={14} height={14} />
            </ActionButton>
            <ActionButton action={deleteEntry.bind(null, e.id)} variant="icon" label="Delete price" confirm={`Delete "${e.serviceLabel.en}"?`}>
              <TrashIcon width={14} height={14} />
            </ActionButton>
          </div>
        </td>
      </tr>
      <tr>
        <td colSpan={5} className="px-5 pb-3 pt-0">
          <details>
            <summary className="cursor-pointer text-xs font-semibold text-primary">Edit</summary>
            <ActionForm action={saveEntry.bind(null, e.id)} className="mt-3 space-y-4 rounded-xl bg-surface-2/30 p-4">
              <EntryFields entry={e} categoryId={e.categoryId} categories={categories} />
              <SubmitButton variant="small">Save price</SubmitButton>
            </ActionForm>
          </details>
        </td>
      </tr>
    </>
  );
}
