"use server";

import { adminFetch } from "../api";
import { attempt, refreshPublic, text } from "../form";
import type { ActionState } from "../types";

export async function savePage(slug: string, locale: string, _: ActionState, fd: FormData) {
  const status = text(fd, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  return attempt(
    async () => {
      await adminFetch(`/pages/${slug}/${locale}`, {
        method: "PUT",
        body: {
          title: text(fd, "title"),
          body: String(fd.get("body") ?? ""),
          seoTitle: text(fd, "seoTitle"),
          metaDescription: text(fd, "metaDescription"),
          status,
        },
      });
      refreshPublic("pages");
    },
    status === "PUBLISHED" ? "Published in this language" : "Saved as draft (not public)",
  );
}
