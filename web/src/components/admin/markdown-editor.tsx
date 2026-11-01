"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/markdown";
import { input, label } from "./styles";

/** Markdown body with a live preview using the public site's renderer. */
export function MarkdownEditor({ name, initial, lang }: { name: string; initial: string; lang: string }) {
  const [value, setValue] = useState(initial);
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={name} className={label}>Body (Markdown)</label>
        <div role="tablist" className="inline-flex rounded-full bg-surface-2 p-0.5 text-xs font-semibold lg:hidden">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 capitalize ${tab === t ? "bg-white text-primary shadow-sm" : "text-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          id={name}
          name={name}
          lang={lang}
          rows={18}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${input} font-mono text-[13px] leading-relaxed ${tab === "preview" ? "hidden lg:block" : ""}`}
        />
        <div
          aria-label="Preview"
          lang={lang}
          className={`max-h-[460px] overflow-y-auto rounded-xl border border-border/70 bg-bg p-5 text-sm ${tab === "write" ? "hidden lg:block" : ""}`}
        >
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-muted">Nothing to preview yet.</p>}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Use <code>## Heading</code>, <code>- list item</code>, <code>**bold**</code> and{" "}
        <code>[link](https://…)</code>. HTML is not rendered.
      </p>
    </div>
  );
}

/** Text input with a live character count against a recommended length. */
export function CountedInput({
  id,
  name,
  initial,
  recommended,
  max,
}: {
  id: string;
  name: string;
  initial: string;
  recommended: number;
  max: number;
}) {
  const [value, setValue] = useState(initial);
  const over = value.length > recommended;
  return (
    <div>
      <input id={id} name={name} value={value} maxLength={max} onChange={(e) => setValue(e.target.value)} className={input} />
      <p className={`mt-1 text-right text-[11px] ${over ? "text-amber-700" : "text-muted"}`}>
        {value.length} / {recommended} recommended
      </p>
    </div>
  );
}
