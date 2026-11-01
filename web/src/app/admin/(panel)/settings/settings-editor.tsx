"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { saveSettings, uploadSiteImage } from "@/lib/admin/actions/settings";
import type { ChannelType, Localized, NavKey, Settings } from "@/lib/admin/types";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { LocalizedControl } from "@/components/admin/localized-control";
import { IMAGE_ACCEPT } from "@/components/admin/image-upload";
import { btn, card, input, label } from "@/components/admin/styles";

export interface LibraryImage {
  path: string;
  url: string;
  width: number;
  height: number;
  name: string;
}

const empty = (): Localized => ({ en: "", "zh-TW": "", "zh-CN": "" });

const NAV_NAMES: Record<NavKey, string> = {
  top: "Top (home)",
  system: "System / prices",
  schedule: "Schedule",
  cast: "Cast",
  access: "Access",
  recruit: "Recruit",
  contact: "Contact",
};

const CHANNELS: { type: ChannelType; name: string; href: (v: string) => string }[] = [
  { type: "phone", name: "Phone", href: (v) => `tel:${v.replace(/[^\d+]/g, "")}` },
  { type: "sms", name: "SMS", href: (v) => `sms:${v.replace(/[^\d+]/g, "")}` },
  { type: "email", name: "Email", href: (v) => `mailto:${v.trim()}` },
  { type: "line", name: "LINE", href: () => "https://line.me/" },
  { type: "whatsapp", name: "WhatsApp", href: (v) => `https://wa.me/${v.replace(/\D/g, "")}` },
  { type: "telegram", name: "Telegram", href: (v) => `https://t.me/${v.replace(/^@/, "")}` },
];

function move<T>(list: T[], i: number, delta: number) {
  const j = i + delta;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className={`${card} scroll-mt-6`}>
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function RowTools({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
  return (
    <div className="flex gap-1.5">
      <button type="button" onClick={onUp} className={btn.small} aria-label="Move up">↑</button>
      <button type="button" onClick={onDown} className={btn.small} aria-label="Move down">↓</button>
      <button type="button" onClick={onRemove} className={btn.smallDanger}>Remove</button>
    </div>
  );
}

function ImageChoice({
  library,
  value,
  onChange,
  onUpload,
  allowNone,
}: {
  library: LibraryImage[];
  value: string | null;
  onChange: (path: string | null) => void;
  onUpload: (image: LibraryImage) => void;
  allowNone?: boolean;
}) {
  const current = library.find((i) => i.path === value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadSiteImage(fd);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onUpload(res.image);
    onChange(res.image.path);
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-2">
          {current && (
            <Image src={current.url} alt="" width={current.width} height={current.height} unoptimized className="h-full w-full object-cover" />
          )}
        </div>
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={input} aria-label="Image">
          {allowNone && <option value="">No image</option>}
          {!allowNone && !value && <option value="">Choose an image…</option>}
          {library.map((i) => (
            <option key={i.path} value={i.path}>{i.name}</option>
          ))}
        </select>
        <label className={`${btn.small} shrink-0 cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function SettingsEditor({ initial, library: initialLibrary }: { initial: Settings; library: LibraryImage[] }) {
  const [s, setS] = useState(initial);
  const [library, setLibrary] = useState(initialLibrary);
  const addImage = (image: LibraryImage) => setLibrary((prev) => [image, ...prev]);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setS((prev) => ({ ...prev, [key]: value }));

  const payload = {
    ...s,
    heroBanners: s.heroBanners.map((b) => ({ path: b.path, alt: b.alt })),
    mapUrl: s.mapUrl?.trim() || null,
  };

  return (
    <ActionForm action={saveSettings} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />

      <nav aria-label="Sections" className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          ["brand", "Brand"],
          ["home", "Home page"],
          ["contact", "Contact & access"],
          ["nav", "Navigation"],
          ["age", "Age gate"],
        ].map(([id, name]) => (
          <a key={id} href={`#${id}`} className="rounded-full bg-white px-3 py-1.5 text-muted ring-1 ring-border hover:text-primary">
            {name}
          </a>
        ))}
      </nav>

      <Section id="brand" title="Brand" description="Shown in the header, footer and browser tab.">
        <LocalizedControl label="Site title" value={s.siteTitle} onChange={(v) => set("siteTitle", v)} />
        <LocalizedControl label="Tagline" value={s.tagline} onChange={(v) => set("tagline", v)} />
        <div>
          <p className={label}>Logo</p>
          <ImageChoice library={library} value={s.logoPath} onChange={(v) => set("logoPath", v)} onUpload={addImage} allowNone />
          <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP or AVIF up to 10 MB. Only upload images you have the rights to use.</p>
        </div>
      </Section>

      <Section id="home" title="Home page" description="Hero banners, introduction and highlight boxes.">
        <div>
          <p className={label}>Hero banners</p>
          <div className="space-y-3">
            {s.heroBanners.map((b, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <ImageChoice
                      library={library}
                      onUpload={addImage}
                      value={b.path}
                      onChange={(path) =>
                        set("heroBanners", s.heroBanners.map((x, j) => (j === i ? { ...x, path: path ?? "" } : x)))
                      }
                    />
                  </div>
                  <RowTools
                    onUp={() => set("heroBanners", move(s.heroBanners, i, -1))}
                    onDown={() => set("heroBanners", move(s.heroBanners, i, 1))}
                    onRemove={() => set("heroBanners", s.heroBanners.filter((_, j) => j !== i))}
                  />
                </div>
                <LocalizedControl
                  label="Alt text"
                  compact
                  value={b.alt}
                  onChange={(alt) => set("heroBanners", s.heroBanners.map((x, j) => (j === i ? { ...x, alt } : x)))}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={s.heroBanners.length >= 10}
            onClick={() => set("heroBanners", [...s.heroBanners, { path: library[0]?.path ?? "", width: 0, height: 0, alt: empty() }])}
            className={`${btn.small} mt-3`}
          >
            + Add banner
          </button>
        </div>
        <LocalizedControl label="Introduction" multiline rows={4} value={s.homeIntro} onChange={(v) => set("homeIntro", v)} />
        <div>
          <p className={label}>Highlights</p>
          <div className="space-y-3">
            {s.highlights.map((h, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border/70 p-3">
                <div className="flex justify-end">
                  <RowTools
                    onUp={() => set("highlights", move(s.highlights, i, -1))}
                    onDown={() => set("highlights", move(s.highlights, i, 1))}
                    onRemove={() => set("highlights", s.highlights.filter((_, j) => j !== i))}
                  />
                </div>
                <LocalizedControl label="Title" value={h.title} onChange={(title) => set("highlights", s.highlights.map((x, j) => (j === i ? { ...x, title } : x)))} />
                <LocalizedControl label="Text" multiline rows={2} value={h.body} onChange={(body) => set("highlights", s.highlights.map((x, j) => (j === i ? { ...x, body } : x)))} />
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={s.highlights.length >= 12}
            onClick={() => set("highlights", [...s.highlights, { title: empty(), body: empty() }])}
            className={`${btn.small} mt-3`}
          >
            + Add highlight
          </button>
        </div>
      </Section>

      <Section id="contact" title="Contact & access" description="Only client-approved contact methods. No exact address unless approved.">
        <LocalizedControl label="Business hours" value={s.businessHours} onChange={(v) => set("businessHours", v)} />
        <LocalizedControl label="Service area (general location)" value={s.serviceArea} onChange={(v) => set("serviceArea", v)} />
        <div>
          <label htmlFor="mapUrl" className={label}>Map link (optional, https only)</label>
          <input id="mapUrl" type="url" placeholder="https://" value={s.mapUrl ?? ""} onChange={(e) => set("mapUrl", e.target.value)} className={input} />
        </div>

        <div>
          <p className={label}>Contact channels</p>
          <div className="space-y-3">
            {s.contactChannels.map((c, i) => {
              const update = (patch: Partial<typeof c>) =>
                set("contactChannels", s.contactChannels.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              const def = CHANNELS.find((d) => d.type === c.type)!;
              return (
                <div key={i} className="space-y-3 rounded-xl border border-border/70 p-3">
                  <div className="grid gap-3 md:grid-cols-[140px_1fr_1fr_auto] md:items-end">
                    <div>
                      <label className={label} htmlFor={`ch-type-${i}`}>Type</label>
                      <select id={`ch-type-${i}`} value={c.type} onChange={(e) => update({ type: e.target.value as ChannelType })} className={input}>
                        {CHANNELS.map((d) => <option key={d.type} value={d.type}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={label} htmlFor={`ch-value-${i}`}>Shown as</label>
                      <input id={`ch-value-${i}`} value={c.value} onChange={(e) => update({ value: e.target.value })} className={input} />
                    </div>
                    <div>
                      <label className={label} htmlFor={`ch-href-${i}`}>Link</label>
                      <div className="flex gap-1.5">
                        <input id={`ch-href-${i}`} value={c.href} onChange={(e) => update({ href: e.target.value })} className={`${input} font-mono text-xs`} />
                        <button type="button" onClick={() => update({ href: def.href(c.value) })} className={btn.small} title="Build link from the shown value">
                          Auto
                        </button>
                      </div>
                    </div>
                    <RowTools
                      onUp={() => set("contactChannels", move(s.contactChannels, i, -1))}
                      onDown={() => set("contactChannels", move(s.contactChannels, i, 1))}
                      onRemove={() => set("contactChannels", s.contactChannels.filter((_, j) => j !== i))}
                    />
                  </div>
                  <LocalizedControl label="Button label" compact value={c.label} onChange={(labelValue) => update({ label: labelValue })} />
                </div>
              );
            })}
          </div>
          <button
            type="button"
            disabled={s.contactChannels.length >= 10}
            onClick={() => set("contactChannels", [...s.contactChannels, { type: "phone", label: empty(), value: "", href: "" }])}
            className={`${btn.small} mt-3`}
          >
            + Add contact channel
          </button>
          <p className="mt-2 text-xs text-muted">Links must start with tel:, sms:, mailto: or https://.</p>
        </div>

        <div>
          <p className={label}>Social links (approved accounts only)</p>
          <div className="space-y-2">
            {s.socialLinks.map((l, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                <input aria-label="Label" placeholder="Label" value={l.label} onChange={(e) => set("socialLinks", s.socialLinks.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={input} />
                <input aria-label="URL" placeholder="https://" value={l.url} onChange={(e) => set("socialLinks", s.socialLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} className={input} />
                <button type="button" onClick={() => set("socialLinks", s.socialLinks.filter((_, j) => j !== i))} className={btn.smallDanger}>Remove</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={s.socialLinks.length >= 10}
            onClick={() => set("socialLinks", [...s.socialLinks, { label: "", url: "" }])}
            className={`${btn.small} mt-3`}
          >
            + Add social link
          </button>
        </div>
      </Section>

      <Section id="nav" title="Navigation" description="Menu order and which pages appear in the menu (SRS Q05).">
        <ol className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
          {s.navigation.map((n, i) => (
            <li key={n.key} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 text-xs font-bold text-muted">{i + 1}</span>
              <label className="flex flex-1 items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={n.visible}
                  disabled={n.key === "top"}
                  onChange={(e) => set("navigation", s.navigation.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)))}
                  className="h-4 w-4 accent-primary"
                />
                {NAV_NAMES[n.key]}
                {!n.visible && <span className="text-xs font-normal text-muted">(hidden from menu)</span>}
              </label>
              <button type="button" onClick={() => set("navigation", move(s.navigation, i, -1))} className={btn.small} aria-label={`Move ${NAV_NAMES[n.key]} up`}>↑</button>
              <button type="button" onClick={() => set("navigation", move(s.navigation, i, 1))} className={btn.small} aria-label={`Move ${NAV_NAMES[n.key]} down`}>↓</button>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="age" title="Age gate" description="Shown before any adult content (WEB-01). Final wording needs legal approval.">
        <LocalizedControl label="Title" value={s.ageGate.title} onChange={(title) => set("ageGate", { ...s.ageGate, title })} />
        <LocalizedControl label="Message" multiline rows={3} value={s.ageGate.body} onChange={(body) => set("ageGate", { ...s.ageGate, body })} />
        <LocalizedControl label="Enter button" value={s.ageGate.enterLabel} onChange={(enterLabel) => set("ageGate", { ...s.ageGate, enterLabel })} />
        <LocalizedControl label="Leave button" value={s.ageGate.leaveLabel} onChange={(leaveLabel) => set("ageGate", { ...s.ageGate, leaveLabel })} />
        <div>
          <label htmlFor="leaveUrl" className={label}>Leave goes to (https)</label>
          <input id="leaveUrl" type="url" value={s.ageGate.leaveUrl} onChange={(e) => set("ageGate", { ...s.ageGate, leaveUrl: e.target.value })} className={input} />
        </div>
      </Section>

      <div className="sticky bottom-4 z-20 flex items-center justify-end gap-3 rounded-2xl border border-border/70 bg-white/95 p-3 shadow-lg backdrop-blur">
        <p className="mr-auto text-xs text-muted">Changes apply to the public site as soon as you save.</p>
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </ActionForm>
  );
}
