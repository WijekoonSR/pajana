"use client";

import { useState } from "react";
import { input } from "./styles";

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const fileInput = `${input} file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary`;

/** File field for a form, with a local preview. Posts `file`. */
export function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          name="file"
          accept={IMAGE_ACCEPT}
          required
          aria-label="Image file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className={fileInput}
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="Selected file preview" className="h-20 w-16 rounded-lg object-cover" />
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        JPEG, PNG, WebP or AVIF up to 10 MB. Uploads are resized and all metadata (including GPS
        location) is removed.
      </p>
    </div>
  );
}
