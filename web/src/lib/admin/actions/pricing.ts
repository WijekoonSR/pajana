"use server";

import { adminFetch } from "../api";
import { attempt, checked, localizedFrom, refreshPublic, text } from "../form";
import type { ActionState, Settings } from "../types";

export async function saveCategory(id: string | null, _: ActionState, fd: FormData) {
  return attempt(async () => {
    await adminFetch(id ? `/pricing/categories/${id}` : "/pricing/categories", {
      method: id ? "PUT" : "POST",
      body: {
        title: localizedFrom(fd, "title"),
        note: localizedFrom(fd, "note"),
        published: checked(fd, "published"),
      },
    });
    refreshPublic("pricing");
  }, id ? "Category saved" : "Category added");
}

export async function deleteCategory(id: string) {
  return attempt(async () => {
    await adminFetch(`/pricing/categories/${id}`, { method: "DELETE" });
    refreshPublic("pricing");
  }, "Category deleted");
}

export async function saveEntry(id: string | null, _: ActionState, fd: FormData) {
  const minutes = text(fd, "durationMinutes");
  return attempt(async () => {
    await adminFetch(id ? `/pricing/entries/${id}` : "/pricing/entries", {
      method: id ? "PUT" : "POST",
      body: {
        categoryId: text(fd, "categoryId"),
        serviceLabel: localizedFrom(fd, "serviceLabel"),
        description: localizedFrom(fd, "description"),
        durationMinutes: minutes ? Number(minutes) : null,
        amount: Number(text(fd, "amount")),
        currency: text(fd, "currency"),
        published: checked(fd, "published"),
      },
    });
    refreshPublic("pricing");
  }, id ? "Price saved" : "Price added");
}

export async function deleteEntry(id: string) {
  return attempt(async () => {
    await adminFetch(`/pricing/entries/${id}`, { method: "DELETE" });
    refreshPublic("pricing");
  }, "Price deleted");
}

function swap(ids: string[], index: number, delta: -1 | 1) {
  const next = [...ids];
  const target = index + delta;
  if (target < 0 || target >= ids.length) return null;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export async function moveCategory(ids: string[], index: number, delta: -1 | 1) {
  const next = swap(ids, index, delta);
  if (!next) return { ok: true, at: Date.now() };
  return attempt(async () => {
    await adminFetch("/pricing/categories/reorder", { method: "POST", body: { ids: next } });
    refreshPublic("pricing");
  }, "Order updated");
}

export async function moveEntry(categoryId: string, ids: string[], index: number, delta: -1 | 1) {
  const next = swap(ids, index, delta);
  if (!next) return { ok: true, at: Date.now() };
  return attempt(async () => {
    await adminFetch(`/pricing/categories/${categoryId}/entries/reorder`, {
      method: "POST",
      body: { ids: next },
    });
    refreshPublic("pricing");
  }, "Order updated");
}

/** The footnote is stored with site settings; update just that field. */
export async function saveFootnote(_: ActionState, fd: FormData) {
  return attempt(async () => {
    const { updatedAt: _u, ...settings } = await adminFetch<Settings>("/settings");
    void _u;
    await adminFetch("/settings", {
      method: "PUT",
      body: {
        ...settings,
        heroBanners: settings.heroBanners.map((b) => ({ path: b.path, alt: b.alt, focusX: b.focusX, focusY: b.focusY, mobileFocusX: b.mobileFocusX, mobileFocusY: b.mobileFocusY })),
        pricingFootnote: localizedFrom(fd, "footnote"),
      },
    });
    refreshPublic("pricing");
  }, "Footnote saved");
}
