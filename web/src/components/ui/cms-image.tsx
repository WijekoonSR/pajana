import Image from "next/image";
import type { CSSProperties } from "react";
import type { MediaAsset } from "@/lib/api/types";

/**
 * Image served by the CMS API. SVG placeholders bypass the optimizer;
 * real photos get resized by next/image.
 */
export function CmsImage({
  asset,
  sizes,
  priority,
  className,
  focus,
  mobileFocus,
}: {
  asset: MediaAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Focal point in percent; with object-cover, this spot stays in view. */
  focus?: { x: number; y: number };
  /** Focal point below the md breakpoint (phones); defaults to `focus`. */
  mobileFocus?: { x: number; y: number };
}) {
  const m = mobileFocus ?? focus;
  return (
    <Image
      src={asset.url}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      priority={priority}
      unoptimized={asset.url.endsWith(".svg")}
      className={focus ? `${className ?? ""} [object-position:var(--focus-m)] md:[object-position:var(--focus)]` : className}
      style={
        focus && m
          ? ({ "--focus": `${focus.x}% ${focus.y}%`, "--focus-m": `${m.x}% ${m.y}%` } as CSSProperties)
          : undefined
      }
    />
  );
}
