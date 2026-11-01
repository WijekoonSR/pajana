"use client";

import { useState } from "react";
import { input, label } from "./styles";

/** Start/end inputs that explain overnight slots as they are typed. */
export function SlotTimes({ start, end }: { start?: string; end?: string }) {
  const [s, setS] = useState(start ?? "12:00");
  const [e, setE] = useState(end ?? "18:00");
  const overnight = !!s && !!e && e < s;
  const same = !!s && s === e;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="start" className={label}>Start</label>
          <input id="start" name="start" type="time" required value={s} onChange={(ev) => setS(ev.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="end" className={label}>End</label>
          <input id="end" name="end" type="time" required value={e} onChange={(ev) => setE(ev.target.value)} className={input} />
        </div>
      </div>
      <p aria-live="polite" className={`mt-2 text-xs ${same ? "text-red-700" : overnight ? "font-semibold text-accent" : "text-muted"}`}>
        {same
          ? "End time must differ from start time."
          : overnight
            ? `Overnight: ends ${e} the next day (shown under the start date).`
            : "Times are Japan time (Asia/Tokyo). An end time earlier than the start means the next day."}
      </p>
    </div>
  );
}
