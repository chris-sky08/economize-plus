import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { validateSafeRedirectPath } from "@/lib/server/security";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const safeRedirect = validateSafeRedirectPath(pathname);

  if (pathname.startsWith("/admin")) {
    try {
      await requireAdmin(request);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/conta", request.url);
      loginUrl.searchParams.set("redirect", safeRedirect);
      loginUrl.searchParams.set("motivo", "acesso_admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
