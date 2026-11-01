"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import type { HeroBanner } from "@/lib/api/types";
import { CmsImage } from "@/components/ui/cms-image";

const INTERVAL_MS = 4000;

/**
 * Hero background that cross-fades through the CMS banners. Pauses on hover and
 * keyboard focus, and stays still for visitors who prefer reduced motion.
 * `children` is the hero content shown above the images.
 */
export function HeroSlideshow({ banners, children }: { banners: HeroBanner[]; children: ReactNode }) {
  const t = useTranslations("home");
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = banners.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (count < 2 || held || reducedMotion) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [index, count, held, reducedMotion]);

  return (
    <div
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
    >
      {banners.map((b, i) => (
        <CmsImage
          key={b.url}
          asset={b}
          sizes="100vw"
          priority={i === 0}
          focus={{ x: b.focusX, y: b.focusY }}
          mobileFocus={{ x: b.mobileFocusX, y: b.mobileFocusY }}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${
            i === index ? "opacity-70" : "opacity-0"
          }`}
        />
      ))}
      {children}
      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-1">
          {banners.map((b, i) => (
            <button
              key={b.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t("showSlide", { index: i + 1, count })}
              aria-current={i === index ? "true" : undefined}
              className="grid h-7 place-items-center px-0.5"
            >
              <span
                className={`block h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
