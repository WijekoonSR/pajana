"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@/lib/api/types";
import { CmsImage } from "@/components/ui/cms-image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";

/**
 * Main photo with a thumbnail row of every photo below it. Thumbnails swap the
 * main photo; tapping the main photo opens a full-screen preview (keyboard and
 * swipe navigation).
 */
export function ProfileGallery({ images, name }: { images: MediaAsset[]; name: string }) {
  const t = useTranslations("cast");
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);
  const moved = useRef(false);

  const count = images.length;
  const isFirst = index === 0;
  const isLast = index === count - 1;
  // Stops at the first and last photo (no wrap-around).
  const go = (delta: number) => {
    moved.current = true;
    setIndex((i) => Math.min(count - 1, Math.max(0, i + delta)));
  };
  const select = (i: number) => {
    moved.current = true;
    setIndex(i);
  };
  const current = images[index];

  // Keep the selected thumbnail visible in the strip (not on first render, so the page does not jump).
  useEffect(() => {
    if (!moved.current) return;
    const thumb = thumbs.current[index];
    const strip = thumb?.closest("ul");
    if (!thumb || !strip) return;
    const left = thumb.offsetLeft - strip.offsetLeft;
    const right = left + thumb.offsetWidth;
    if (left < strip.scrollLeft) strip.scrollTo({ left, behavior: "smooth" });
    else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth, behavior: "smooth" });
    }
  }, [index]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openPhoto", { index: index + 1, count })}
        className="block w-full cursor-zoom-in overflow-hidden rounded-3xl border border-border shadow-lg shadow-primary/10"
      >
        <CmsImage
          key={current.url}
          asset={current}
          sizes="(min-width: 1152px) 540px, (min-width: 768px) 48vw, 100vw"
          priority={index === 0}
          className="aspect-[3/4] w-full object-cover"
        />
      </button>

      {count > 1 && (
        <div className="flex items-center gap-2">
          <StripArrow label={t("prevPhoto")} disabled={isFirst} onClick={() => go(-1)}>
            <ChevronLeftIcon width={18} height={18} />
          </StripArrow>
          <ul className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto [scrollbar-width:none] md:gap-3 [&::-webkit-scrollbar]:hidden">
            {images.map((img, i) => (
              <li key={img.url} className="w-[calc((100%-1.5rem)/4)] shrink-0 snap-start md:w-[calc((100%-2.25rem)/4)]">
                <button
                  ref={(el) => {
                    thumbs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => select(i)}
                  aria-label={t("photoOf", { index: i + 1, name })}
                  aria-current={i === index ? "true" : undefined}
                  className={`block w-full overflow-hidden rounded-xl border-2 transition ${
                    i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <CmsImage asset={img} sizes="120px" className="aspect-[3/4] w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <StripArrow label={t("nextPhoto")} disabled={isLast} onClick={() => go(1)}>
            <ChevronRightIcon width={18} height={18} />
          </StripArrow>
        </div>
      )}

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
        aria-label={t("gallery")}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-black/90"
      >
        {open && (
          <div className="relative flex h-full w-full items-center justify-center" onClick={() => setOpen(false)}>
            {/* Clicks on the photo itself keep the preview open. */}
            <div onClick={(e) => e.stopPropagation()}>
              <CmsImage
                key={current.url}
                asset={current}
                sizes="100vw"
                className="max-h-[88dvh] w-auto max-w-[92vw] rounded-lg object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closePreview")}
              className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-2xl leading-none text-white hover:bg-white/25"
            >
              ×
            </button>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  disabled={isFirst}
                  aria-label={t("prevPhoto")}
                  className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeftIcon width={22} height={22} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  disabled={isLast}
                  aria-label={t("nextPhoto")}
                  className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronRightIcon width={22} height={22} />
                </button>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                  {index + 1} / {count}
                </p>
              </>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}

function StripArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-primary shadow-sm transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-muted disabled:opacity-40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
