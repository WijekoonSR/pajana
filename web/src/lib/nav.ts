import type { NavItem, NavKey } from "./api/types";

export const NAV_HREF: Record<NavKey, string> = {
  top: "/",
  system: "/system",
  schedule: "/schedule",
  cast: "/cast",
  access: "/access",
  recruit: "/recruit",
  contact: "/contact",
};

/** CMS-configured order (SRS Q05), hidden items removed. */
export function visibleNav(items: NavItem[]) {
  return items
    .filter((item) => item.visible && item.key in NAV_HREF)
    .map((item) => ({ key: item.key, href: NAV_HREF[item.key] }));
}
