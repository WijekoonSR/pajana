import type { ContactChannel } from "@/lib/api/types";
import { ChannelIcon } from "./icons";

export function ContactButtons({
  channels,
  className = "",
}: {
  channels: ContactChannel[];
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
      {channels.map((c, i) => (
        <a
          key={`${c.type}-${c.value}`}
          href={c.href}
          className={`inline-flex min-w-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
            i === 0
              ? "bg-brand-gradient text-white shadow-lg shadow-primary/30"
              : "border-2 border-primary bg-surface text-primary"
          }`}
        >
          <ChannelIcon type={c.type} />
          <span className="truncate">
            {c.label} {c.value}
          </span>
        </a>
      ))}
    </div>
  );
}
