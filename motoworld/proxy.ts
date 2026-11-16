import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { bookingReturnHeader, bookingReturnPath } from "@/lib/admin-links";

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const development = process.env.NODE_ENV === "development";
  const analytics = process.env.PLAUSIBLE_DOMAIN ? " https://plausible.io" : "";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    `connect-src 'self'${analytics}${development ? " ws: wss:" : ""}`,
    "frame-src https://www.google.com https://maps.google.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  headers.delete(bookingReturnHeader);
  const booking = bookingReturnPath(request.nextUrl.pathname);
  if (booking) headers.set(bookingReturnHeader, booking);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  if (request.nextUrl.pathname.startsWith("/admin")) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|icons/|images/).*)"],
};
