const OBJECTS: Record<string, string> = {
  profile: "Profile",
  profile_media: "Profile image",
  media: "Media",
  schedule: "Schedule slot",
  pricing_category: "Price category",
  pricing_entry: "Price line",
  page: "Page",
  settings: "Site settings",
  user: "Admin user",
  auth: "Account",
};

const VERBS: Record<string, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
  reorder: "reordered",
  add: "added",
  remove: "removed",
  upload: "uploaded",
  replace: "replaced",
  published: "published",
  draft: "moved to draft",
  hidden: "hidden",
  archived: "archived",
  save_published: "published",
  save_draft: "saved as draft",
  login: "signed in",
  logout: "signed out",
  locked: "locked after failed sign-ins",
  password_change: "password changed",
  password_reset: "password reset",
};

/** "profile.published" -> "Profile published". */
export function describeAction(action: string) {
  const [object, verb] = action.split(".");
  return `${OBJECTS[object] ?? object} ${VERBS[verb] ?? verb ?? ""}`.trim();
}
