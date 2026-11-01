import {
  addDays,
  endsNextDay,
  isValidDate,
  isValidTime,
  tokyoDateOf,
  tokyoSlot,
  tokyoStartOfDay,
  tokyoTimeOf,
  toTokyoIso,
} from './tokyo-time.js';

describe('tokyo-time', () => {
  it('maps late UTC instants to the next Tokyo date', () => {
    expect(tokyoDateOf(new Date('2026-10-25T14:59:59Z'))).toBe('2026-10-25');
    expect(tokyoDateOf(new Date('2026-10-25T15:00:00Z'))).toBe('2026-10-26');
  });

  it('formats instants with a +09:00 offset', () => {
    expect(toTokyoIso(new Date('2026-10-25T11:00:00Z'))).toBe(
      '2026-10-25T20:00:00+09:00',
    );
  });

  it('computes Tokyo midnight', () => {
    expect(tokyoStartOfDay('2026-10-26').toISOString()).toBe(
      '2026-10-25T15:00:00.000Z',
    );
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('validates real calendar dates only', () => {
    expect(isValidDate('2026-10-25')).toBe(true);
    expect(isValidDate('2026-02-31')).toBe(false);
    expect(isValidDate('2026-1-5')).toBe(false);
  });

  it('detects overnight slots in Tokyo time', () => {
    const start = new Date('2026-10-25T20:00:00+09:00');
    expect(endsNextDay(start, new Date('2026-10-26T02:00:00+09:00'))).toBe(true);
    expect(endsNextDay(start, new Date('2026-10-26T00:00:00+09:00'))).toBe(false);
    expect(endsNextDay(start, new Date('2026-10-25T23:00:00+09:00'))).toBe(false);
  });
});

describe('tokyoSlot', () => {
  it('keeps same-day slots on the date', () => {
    const { startAt, endAt, overnight } = tokyoSlot('2026-10-25', '12:00', '18:00');
    expect(startAt.toISOString()).toBe('2026-10-25T03:00:00.000Z');
    expect(endAt.toISOString()).toBe('2026-10-25T09:00:00.000Z');
    expect(overnight).toBe(false);
  });

  it('moves an earlier end time to the next day', () => {
    const { endAt, overnight } = tokyoSlot('2026-10-25', '20:00', '02:00');
    expect(toTokyoIso(endAt)).toBe('2026-10-26T02:00:00+09:00');
    expect(overnight).toBe(true);
  });

  it('treats an equal end time as a 24 hour slot', () => {
    const { startAt, endAt } = tokyoSlot('2026-10-25', '10:00', '10:00');
    expect(endAt.getTime() - startAt.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('formats Tokyo wall-clock time', () => {
    expect(tokyoTimeOf(new Date('2026-10-25T15:30:00Z'))).toBe('00:30');
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('23:59')).toBe(true);
  });
});
