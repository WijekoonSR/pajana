import { Suspense } from "react";
import { AdminShell, ShellSkeleton } from "@/components/admin/shell";

// Every admin page reads the session cookie, so nothing here is prerendered.
export const instant = false;

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
