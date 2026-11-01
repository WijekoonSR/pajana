import Image from "next/image";
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
}: {
  asset: MediaAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={asset.url}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      priority={priority}
      unoptimized={asset.url.endsWith(".svg")}
      className={className}
    />
  );
}
