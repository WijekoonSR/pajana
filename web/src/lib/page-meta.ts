import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getPage } from "./api/client";
import type { PageSlug } from "./api/types";

/** SEO title/description managed per locale in the CMS (CMS-05). */
export async function cmsPageMetadata(slug: PageSlug, fallbackTitle: string): Promise<Metadata> {
  const page = await getPage(await getLocale(), slug);
  return {
    title: page?.seoTitle || page?.title || fallbackTitle,
    description: page?.metaDescription || undefined,
  };
}
