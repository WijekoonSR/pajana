import { getFormatter, getTranslations } from "next-intl/server";
import type { ScheduleSlot } from "@/lib/api/types";
import { ClockIcon } from "@/components/ui/icons";

/**
 * "20:00 - 02:00 (next day)" in Japan time, or a day-off label.
 * `nextDayBelow` puts the full "(next day)" label on its own line for narrow cells.
 */
export async function SlotTime({
  slot,
  compact,
  nextDayBelow,
}: {
  slot: ScheduleSlot;
  compact?: boolean;
  nextDayBelow?: boolean;
}) {
  const [format, t] = await Promise.all([getFormatter(), getTranslations("schedule")]);

  if (slot.status === "day_off") {
    return <span className="text-xs font-medium text-muted">{t("dayOff")}</span>;
  }

  const time = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

  if (nextDayBelow) {
    return (
      <span className="flex flex-col items-center text-xs font-bold text-primary">
        <span className="whitespace-nowrap">
          <time dateTime={slot.start}>{time(slot.start)}</time>
          <span aria-hidden="true"> - </span>
          <time dateTime={slot.end}>{time(slot.end)}</time>
        </span>
        {slot.endsNextDay && (
          <span className="text-[10px] font-medium text-accent">{t("nextDayLabel")}</span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-primary">
      {!compact && <ClockIcon width={13} height={13} />}
      <time dateTime={slot.start}>{time(slot.start)}</time>
      <span aria-hidden="true">-</span>
      <time dateTime={slot.end}>{time(slot.end)}</time>
      {slot.endsNextDay && (
        <span className="whitespace-nowrap rounded bg-surface-2 px-1 text-[10px] font-medium text-accent">
          {compact ? t("nextDayShort") : t("nextDayLabel")}
        </span>
      )}
    </span>
  );
}
