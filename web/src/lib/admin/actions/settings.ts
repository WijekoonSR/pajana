"use server";

import { unstable_rethrow } from "next/navigation";
import { AdminApiError, adminFetch, mediaUrl } from "../api";
import { attempt, jsonFrom, refreshPublic } from "../form";
import type { ActionState, MediaItem } from "../types";

export async function saveSettings(_: ActionState, fd: FormData) {
  return attempt(async () => {
    await adminFetch("/settings", { method: "PUT", body: jsonFrom<object>(fd) });
    refreshPublic("settings", "pricing");
  }, "Site settings saved");
}

/** Uploads a logo or banner image; it is used once the settings are saved. */
export async function uploadSiteImage(
  fd: FormData,
): Promise<{ ok: true; image: { path: string; url: string; width: number; height: number; name: string } } | { ok: false; error: string }> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image file to upload" };
  const upload = new FormData();
  upload.set("file", file);
  try {
    const a = await adminFetch<MediaItem>("/media", { method: "POST", body: upload });
    return { ok: true, image: { path: a.path, url: mediaUrl(a.path), width: a.width, height: a.height, name: a.originalName } };
  } catch (e) {
    unstable_rethrow(e);
    return { ok: false, error: e instanceof AdminApiError ? e.message : "Upload failed. Please try again." };
  }
}
