import type { Metadata, Viewport } from "next";
import "../globals.css";

// The admin panel is English only and has its own root layout, separate from
// the localized public site.
export const metadata: Metadata = {
  title: { default: "CMS", template: "%s | 粉色誘惑 CMS" },
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

export const viewport: Viewport = {
  themeColor: "#24091a",
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
