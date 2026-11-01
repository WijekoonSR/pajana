// Japan has no daylight saving time, so Asia/Tokyo is always UTC+09:00.
const OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Asia/Tokyo calendar date (YYYY-MM-DD) of an instant. */
export function tokyoDateOf(instant: Date): string {
  return new Date(instant.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Today in Asia/Tokyo. */
export function tokyoToday(now: Date = new Date()): string {
  return tokyoDateOf(now);
}

/** Instant of 00:00 Asia/Tokyo on the given date. */
export function tokyoStartOfDay(date: string): Date {
  return new Date(`${date}T00:00:00+09:00`);
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** True for a well-formed, real calendar date (rejects 2026-02-31). */
export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

/** ISO 8601 string in Asia/Tokyo with explicit offset, e.g. 2026-10-25T20:00:00+09:00. */
export function toTokyoIso(instant: Date): string {
  const local = new Date(instant.getTime() + OFFSET_MS).toISOString();
  return `${local.slice(0, 19)}+09:00`;
}

/**
 * True when a slot ends on a later Tokyo calendar day than it starts.
 * Ending exactly at midnight counts as the same day (e.g. 20:00-24:00).
 */
export function endsNextDay(start: Date, end: Date): boolean {
  return tokyoDateOf(new Date(end.getTime() - 1)) > tokyoDateOf(start);
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** True for HH:mm between 00:00 and 23:59. */
export function isValidTime(time: string): boolean {
  return TIME_RE.test(time);
}

/**
 * Instants for a slot entered as a Tokyo date plus start/end wall-clock times.
 * An end time at or before the start time means the slot ends the next day
 * (e.g. 20:00-02:00), so slots are always 1 minute to 24 hours long.
 */
export function tokyoSlot(date: string, start: string, end: string) {
  const startAt = new Date(`${date}T${start}:00+09:00`);
  const overnight = end <= start;
  const endAt = new Date(`${overnight ? addDays(date, 1) : date}T${end}:00+09:00`);
  return { startAt, endAt, overnight };
}

/** HH:mm in Asia/Tokyo for an instant. */
export function tokyoTimeOf(instant: Date): string {
  return toTokyoIso(instant).slice(11, 16);
}
