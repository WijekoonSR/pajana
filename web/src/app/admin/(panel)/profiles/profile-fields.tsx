import type { Profile } from "@/lib/admin/types";
import { AttributesEditor } from "@/components/admin/attributes-editor";
import { input } from "@/components/admin/styles";
import { Field, LocalizedField } from "@/components/admin/ui";

/** Shared fields of the create and edit profile forms. */
export function ProfileFields({ profile }: { profile?: Profile }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Field
          label="URL slug"
          htmlFor="slug"
          hint={<>Public address: /cast/<strong>{profile?.slug ?? "your-slug"}</strong>. Lowercase letters, numbers and hyphens.</>}
        >
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={60}
            defaultValue={profile?.slug}
            className={`${input} font-mono`}
          />
        </Field>
        <label className="flex w-fit items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="isNew" defaultChecked={profile?.isNew} className="h-4 w-4 accent-primary" />
          Show &ldquo;New&rdquo; badge
        </label>
      </div>
      <LocalizedField name="displayName" label="Display name" value={profile?.displayName} requireEnglish maxLength={80} />
      <AttributesEditor initial={profile?.attributes ?? []} />
      <LocalizedField name="bio" label="Biography" value={profile?.bio} multiline rows={5} />
      <LocalizedField name="comment" label="Short comment" value={profile?.comment} multiline rows={2} />
    </div>
  );
}
