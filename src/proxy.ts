import { NextRequest, NextResponse } from "next/server";
import {
  requireAdmin,
  requireMarketMember,
} from "@/lib/server/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    try {
      await requireAdmin(request);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/conta", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("motivo", "acesso_admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/painel-parceiro")) {
    try {
      await requireMarketMember(request);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/conta", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("motivo", "acesso_parceiro");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/painel-parceiro/:path*"],
};
