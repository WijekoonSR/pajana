"use server";

import { adminFetch } from "../api";
import { attempt, localizedFrom, refreshPublic, text } from "../form";
import type { ActionState } from "../types";

function slotBody(fd: FormData) {
  return {
    profileId: text(fd, "profileId"),
    date: text(fd, "date"),
    start: text(fd, "start"),
    end: text(fd, "end"),
    status: text(fd, "status"),
    publicNote: localizedFrom(fd, "publicNote"),
  };
}

export async function saveSlot(id: string | null, _: ActionState, fd: FormData) {
  return attempt(async () => {
    await adminFetch(id ? `/schedule/${id}` : "/schedule", {
      method: id ? "PUT" : "POST",
      body: slotBody(fd),
    });
    refreshPublic("schedule", "profiles");
  }, id ? "Slot updated" : "Slot added");
}

export async function deleteSlot(id: string) {
  return attempt(async () => {
    await adminFetch(`/schedule/${id}`, { method: "DELETE" });
    refreshPublic("schedule", "profiles");
  }, "Slot deleted");
}
