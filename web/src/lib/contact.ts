import type { ContactChannel } from "./api/types";

export function findChannel(
  channels: ContactChannel[],
  type: ContactChannel["type"],
) {
  return channels.find((c) => c.type === type);
}
