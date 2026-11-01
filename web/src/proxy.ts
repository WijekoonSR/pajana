import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_PREFIXES, routing } from "./i18n/routing";
import { AGE_COOKIE } from "./lib/age-gate";
import { ADMIN_COOKIE } from "./lib/admin/cookie";

const handleI18n = createMiddleware(routing);
const prefixes = Object.values(LOCALE_PREFIXES);

/**
 * Admin pages without a session cookie go straight to the login page. This is
 * only a fast path; every admin request is still verified by the API.
 */
function adminProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login" || request.cookies.has(ADMIN_COOKIE)) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminProxy(request);

  const response = handleI18n(request);
  if (response.headers.get("location")) return response;

  // WEB-01: require the 18+ acknowledgement before any adult-facing page.
  const { search } = request.nextUrl;
  const prefix = prefixes.find(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!prefix) return response;

  const rest = pathname.slice(prefix.length);
  const isGatePage = rest === "/age-check" || rest.startsWith("/age-check/");
  if (isGatePage || request.cookies.get(AGE_COOKIE)?.value === "1") {
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = `${prefix}/age-check`;
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
