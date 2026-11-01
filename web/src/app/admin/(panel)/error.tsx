"use client";

import { btn } from "@/components/admin/styles";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
      <h1 className="text-lg font-bold text-ink">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-muted">
        The CMS API may be unavailable. Check that it is running, then try again.
      </p>
      <button type="button" onClick={reset} className={`${btn.primary} mt-6`}>
        Try again
      </button>
    </div>
  );
}
