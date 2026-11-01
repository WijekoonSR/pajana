import { getTranslations } from "next-intl/server";
import type { ContactChannel } from "@/lib/api/types";
import { findChannel } from "@/lib/contact";
import { MessageIcon, PhoneIcon } from "@/components/ui/icons";

/** Fixed call/SMS actions on phones (SRS 08: tel/sms links on mobile). */
export async function MobileCtaBar({ channels }: { channels: ContactChannel[] }) {
  const t = await getTranslations("common");
  const phone = findChannel(channels, "phone");
  const sms = findChannel(channels, "sms");
  if (!phone && !sms) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        {phone && (
          <a
            href={phone.href}
            className="bg-brand-gradient flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30"
          >
            <PhoneIcon />
            {t("callNow")}
          </a>
        )}
        {sms && (
          <a
            href={sms.href}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-surface px-4 py-3 text-sm font-bold text-primary"
          >
            <MessageIcon />
            {t("sms")}
          </a>
        )}
      </div>
    </div>
  );
}
