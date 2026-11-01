import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminApiError, adminFetch, mediaUrl } from "@/lib/admin/api";
import {
  addProfileMedia,
  deleteProfile,
  makePrimary,
  moveProfileMedia,
  removeProfileMedia,
  setVisibility,
  updateProfile,
  updateProfileMedia,
} from "@/lib/admin/actions/profiles";
import type { Profile } from "@/lib/admin/types";
import { ActionButton, ActionForm, SubmitButton } from "@/components/admin/action-form";
import { ChevronLeft, ExternalIcon, StarIcon, TrashIcon } from "@/components/admin/icons";
import { ImageUpload } from "@/components/admin/image-upload";
import { btn } from "@/components/admin/styles";
import {
  Badge,
  Card,
  LocalizedField,
  MissingLocales,
  PageHeader,
  Thumb,
  VisibilityBadge,
  formatDateTime,
} from "@/components/admin/ui";
import { ProfileFields } from "../profile-fields";

export const metadata: Metadata = { title: "Edit profile" };

async function load(id: string) {
  try {
    return await adminFetch<Profile>(`/profiles/${id}`);
  } catch (e) {
    if (e instanceof AdminApiError && (e.status === 404 || e.status === 400)) notFound();
    throw e;
  }
}

export default async function EditProfilePage({ params, searchParams }: PageProps<"/admin/profiles/[id]">) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const p = await load(id);
  const mediaIds = p.media.map((m) => m.id);
  const primary = p.media.find((m) => m.isPrimary) ?? p.media[0];

  return (
    <>
      <PageHeader
        back={
          <Link href="/admin/profiles" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-primary">
            <ChevronLeft width={16} height={16} /> Profiles
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {p.displayName.en || p.slug}
            <VisibilityBadge value={p.visibility} />
          </span>
        }
        description={<>Last updated {formatDateTime(p.updatedAt)} (Tokyo time)</>}
        actions={
          <>
            {p.visibility === "PUBLISHED" && (
              <a href={`/en/cast/${p.slug}`} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
                <ExternalIcon width={15} height={15} /> View live
              </a>
            )}
            {p.visibility !== "PUBLISHED" && p.visibility !== "ARCHIVED" && (
              <ActionButton action={setVisibility.bind(null, p.id, "PUBLISHED")} variant="primary">
                Publish
              </ActionButton>
            )}
            {p.visibility === "PUBLISHED" && (
              <ActionButton
                action={setVisibility.bind(null, p.id, "HIDDEN")}
                confirm="Hide this profile? It disappears from the cast list, schedule and its page."
              >
                Unpublish
              </ActionButton>
            )}
            {p.visibility === "HIDDEN" && (
              <ActionButton action={setVisibility.bind(null, p.id, "DRAFT")}>Move to draft</ActionButton>
            )}
            {p.visibility !== "ARCHIVED" ? (
              <ActionButton
                action={setVisibility.bind(null, p.id, "ARCHIVED")}
                variant="danger"
                confirm="Archive this profile? It will be removed from the public site."
              >
                Archive
              </ActionButton>
            ) : (
              <>
                <ActionButton action={setVisibility.bind(null, p.id, "DRAFT")}>Restore as draft</ActionButton>
                <ActionButton
                  action={deleteProfile.bind(null, p.id)}
                  variant="danger"
                  confirm="Delete this profile permanently, with its gallery and schedule? This cannot be undone."
                >
                  Delete permanently
                </ActionButton>
              </>
            )}
          </>
        }
      />

      {created && (
        <p className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Draft created. Add photos below, check the preview, then press <strong>Publish</strong>.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <ActionForm action={updateProfile.bind(null, p.id)}>
            <Card
              title="Profile details"
              description="Each language is edited separately. Empty translations show the English text."
              actions={<MissingLocales locales={p.missingLocales} />}
            >
              <ProfileFields profile={p} />
              <div className="mt-6 flex justify-end">
                <SubmitButton>Save details</SubmitButton>
              </div>
            </Card>
          </ActionForm>

          <Card
            title="Gallery"
            description="The starred image is the main photo."
          >
            {p.media.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {p.media.map((m, i) => (
                  <li key={m.id} className="overflow-hidden rounded-2xl border border-border/70">
                    <div className="relative">
                      <Thumb
                        src={mediaUrl(m.path)}
                        alt={m.altText.en}
                        width={m.width}
                        height={m.height}
                        className="aspect-[3/4] w-full"
                      />
                      <div className="absolute left-2 top-2 flex gap-1">
                        {m.isPrimary && <Badge tone="night">★ Main</Badge>}
                      </div>
                    </div>
                    <div className="space-y-3 p-3">
                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton action={moveProfileMedia.bind(null, p.id, mediaIds, i, -1)} variant="small" label="Move earlier">
                          ←
                        </ActionButton>
                        <ActionButton action={moveProfileMedia.bind(null, p.id, mediaIds, i, 1)} variant="small" label="Move later">
                          →
                        </ActionButton>
                        {!m.isPrimary && (
                          <ActionButton action={makePrimary.bind(null, p.id, m.id)} variant="small">
                            <StarIcon width={12} height={12} /> Main
                          </ActionButton>
                        )}
                        <ActionButton
                          action={removeProfileMedia.bind(null, p.id, m.id)}
                          variant="smallDanger"
                          confirm="Delete this image permanently? This cannot be undone."
                          label="Delete image"
                        >
                          <TrashIcon width={12} height={12} />
                        </ActionButton>
                      </div>
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-semibold text-primary">Alt text</summary>
                        <ActionForm action={updateProfileMedia.bind(null, p.id, m.id)} className="mt-3 space-y-3">
                          <LocalizedField stacked name="altText" idPrefix={m.id} label="Alt text" value={m.altText} maxLength={200} />
                          <SubmitButton variant="small">Save image</SubmitButton>
                        </ActionForm>
                      </details>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className={p.media.length ? "mt-6 border-t border-border/60 pt-6" : ""}>
              <h3 className="mb-3 text-sm font-bold text-ink">Add an image</h3>
              <ActionForm
                key={p.media.length}
                action={addProfileMedia.bind(null, p.id)}
                resetOnSuccess
                className="space-y-4"
              >
                <ImageUpload />
                <LocalizedField name="altText" label="Alt text (describe the image)" maxLength={200} />
                <SubmitButton>Add to gallery</SubmitButton>
              </ActionForm>
            </div>
          </Card>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-10 xl:self-start">
          <Card title="Card preview" description="As it appears in the cast list">
            <div className="mx-auto max-w-[220px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <Thumb
                src={primary ? mediaUrl(primary.path) : null}
                alt=""
                width={primary?.width ?? 3}
                height={primary?.height ?? 4}
                className="aspect-[3/4] w-full"
              />
              <div className="p-3">
                <p className="font-bold text-ink">{p.displayName.en}</p>
                <p className="text-xs text-muted">
                  {p.attributes.map((a) => `${a.label.en} ${a.value.en}`).join(" · ")}
                </p>
              </div>
            </div>
            <dl className="mt-4 space-y-1 text-xs">
              {(["zh-TW", "zh-CN"] as const).map((l) => (
                <div key={l} className="flex justify-between gap-2">
                  <dt className="text-muted">{l === "zh-TW" ? "繁中" : "简中"}</dt>
                  <dd className="font-medium text-ink">{p.displayName[l] || <em className="text-amber-700">uses English</em>}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Visibility rules">
            <ul className="space-y-2 text-xs text-muted">
              <li><strong className="text-ink">Published</strong>: in the cast list, schedule and its own page.</li>
              <li><strong className="text-ink">Draft / Hidden</strong>: nowhere public; the page URL shows not found.</li>
              <li><strong className="text-ink">Archived</strong>: retired. Can be restored or deleted.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
