import { Link } from "@/i18n/navigation";

const EMOJI = /\p{Extended_Pictographic}/u;

/** Splits trailing emoji off so gradient text clipping does not hide it. */
function splitTitle(title: string) {
  const chars = Array.from(title);
  const idx = chars.findIndex((c) => EMOJI.test(c));
  if (idx === -1) return { text: title, emoji: "" };
  return { text: chars.slice(0, idx).join(""), emoji: chars.slice(idx).join("") };
}

export function BrandMark({
  title,
  tagline,
  size = "md",
  tone = "light",
}: {
  title: string;
  tagline?: string;
  size?: "md" | "lg";
  /** "dark" for use on the night-colored footer. */
  tone?: "light" | "dark";
}) {
  const { text, emoji } = splitTitle(title);
  return (
    <Link href="/" className="group inline-flex min-w-0 flex-col leading-none">
      <span className="flex items-center gap-1">
        <span
          className={`text-brand-gradient whitespace-nowrap font-brand font-black tracking-[0.12em] ${
            size === "lg" ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
          }`}
        >
          {text}
        </span>
        {emoji && (
          <span
            aria-hidden="true"
            className={`transition-transform group-hover:scale-110 ${
              size === "lg" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
            }`}
          >
            {emoji}
          </span>
        )}
      </span>
      {tagline && (
        <span
          className={`mt-1.5 truncate text-[11px] tracking-wide md:text-xs ${
            tone === "dark" ? "text-night-ink/70" : "text-muted"
          }`}
        >
          {tagline}
        </span>
      )}
    </Link>
  );
}
