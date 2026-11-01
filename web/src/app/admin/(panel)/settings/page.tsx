import type { Metadata } from "next";
import { adminFetch, mediaUrl } from "@/lib/admin/api";
import type { MediaItem, Settings } from "@/lib/admin/types";
import { PageHeader, formatDateTime } from "@/components/admin/ui";
import { SettingsEditor } from "./settings-editor";

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage() {
  const [settings, media] = await Promise.all([
    adminFetch<Settings>("/settings"),
    adminFetch<MediaItem[]>("/media"),
  ]);
  return (
    <>
      <PageHeader
        title="Site settings"
        description={`Site-wide content for all three languages. Last saved ${formatDateTime(settings.updatedAt)}.`}
      />
      <SettingsEditor
        initial={settings}
        library={media
          // Cast photos belong to their profile; only site images are offered here.
          .filter((m) => !m.usedBy.some((u) => u.startsWith("profile ")))
          .map((m) => ({ path: m.path, url: mediaUrl(m.path), width: m.width, height: m.height, name: m.originalName }))}
      />
    </>
  );
}
