import type { ReactNode } from "react";

/**
 * Wrapping row of fixed-width profile cards, centered, so a part-filled row
 * (e.g. the last one) sits in the middle instead of hugging the left edge.
 * Phones: 2 per row; then 3; desktop 4. Cards stretch to the row height, and
 * ProfileCard keeps a fixed text structure so every row is the same height.
 */
export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="flex flex-wrap justify-center gap-3 md:gap-4 [&>li]:flex [&>li]:w-[calc(50%-0.375rem)] sm:[&>li]:w-44 lg:[&>li]:w-56 xl:[&>li]:w-66 [&>li>*]:w-full">
      {children}
    </ul>
  );
}
