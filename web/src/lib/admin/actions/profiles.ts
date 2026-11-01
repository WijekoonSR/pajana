"use server";

import { redirect } from "next/navigation";
import { adminFetch } from "../api";
import { attempt, checked, jsonFrom, localizedFrom, refreshPublic, text } from "../form";
import type { ActionState, Profile, ProfileAttribute, Visibility } from "../types";

function profileBody(fd: FormData) {
  return {
    slug: text(fd, "slug"),
    displayName: localizedFrom(fd, "displayName"),
    bio: localizedFrom(fd, "bio"),
    comment: localizedFrom(fd, "comment"),
    attributes: jsonFrom<ProfileAttribute[]>(fd, "attributes"),
    isNew: checked(fd, "isNew"),
  };
}

export async function createProfile(_: ActionState, fd: FormData): Promise<ActionState> {
  let id = "";
  const state = await attempt(async () => {
    id = (await adminFetch<Profile>("/profiles", { method: "POST", body: profileBody(fd) })).id;
  });
  if (!state.ok) return state;
  redirect(`/admin/profiles/${id}?created=1`);
}

export async function updateProfile(id: string, _: ActionState, fd: FormData) {
  return attempt(async () => {
    await adminFetch(`/profiles/${id}`, { method: "PATCH", body: profileBody(fd) });
    refreshPublic("profiles", "schedule");
  });
}

const VISIBILITY_MESSAGE: Record<Visibility, string> = {
  PUBLISHED: "Published. The profile is now visible on the public site.",
  DRAFT: "Moved back to draft.",
  HIDDEN: "Hidden from the public site.",
  ARCHIVED: "Archived.",
};

export async function setVisibility(id: string, visibility: Visibility) {
  return attempt(async () => {
    await adminFetch(`/profiles/${id}`, { method: "PATCH", body: { visibility } });
    refreshPublic("profiles", "schedule");
  }, VISIBILITY_MESSAGE[visibility]);
}

export async function deleteProfile(id: string) {
  const state = await attempt(async () => {
    await adminFetch(`/profiles/${id}`, { method: "DELETE" });
    refreshPublic("profiles", "schedule");
  });
  if (!state.ok) return state;
  redirect("/admin/profiles");
}

export async function moveProfile(id: string, direction: "up" | "down") {
  return attempt(async () => {
    await adminFetch(`/profiles/${id}/move`, { method: "POST", body: { direction } });
    refreshPublic("profiles", "schedule");
  }, "Order updated");
}

// --- Gallery ---------------------------------------------------------------

export async function addProfileMedia(profileId: string, _: ActionState, fd: FormData) {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file to upload", at: Date.now() };
  }
  return attempt(async () => {
    const upload = new FormData();
    upload.set("file", file);
    const { id: assetId } = await adminFetch<{ id: string }>("/media", { method: "POST", body: upload });
    await adminFetch(`/profiles/${profileId}/media`, {
      method: "POST",
      body: {
        assetId,
        altText: localizedFrom(fd, "altText"),
      },
    });
    refreshPublic("profiles", "schedule");
  }, "Image added");
}

export async function updateProfileMedia(
  profileId: string,
  mediaId: string,
  _: ActionState,
  fd: FormData,
) {
  return attempt(async () => {
    await adminFetch(`/profiles/${profileId}/media/${mediaId}`, {
      method: "PATCH",
      body: { altText: localizedFrom(fd, "altText") },
    });
    refreshPublic("profiles", "schedule");
  }, "Image details saved");
}

export async function makePrimary(profileId: string, mediaId: string) {
  return attempt(async () => {
    await adminFetch(`/profiles/${profileId}/media/${mediaId}`, {
      method: "PATCH",
      body: { isPrimary: true },
    });
    refreshPublic("profiles", "schedule");
  }, "Main photo updated");
}

export async function removeProfileMedia(profileId: string, mediaId: string) {
  return attempt(async () => {
    await adminFetch(`/profiles/${profileId}/media/${mediaId}`, { method: "DELETE" });
    refreshPublic("profiles", "schedule");
  }, "Image deleted");
}

export async function moveProfileMedia(
  profileId: string,
  ids: string[],
  index: number,
  delta: -1 | 1,
) {
  const target = index + delta;
  if (target < 0 || target >= ids.length) return { ok: true, at: Date.now() };
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return attempt(async () => {
    await adminFetch(`/profiles/${profileId}/media/reorder`, { method: "POST", body: { ids: next } });
    refreshPublic("profiles", "schedule");
  }, "Gallery order updated");
}
