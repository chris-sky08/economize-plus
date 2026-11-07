import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/server/auth";
import { validateSafeRedirectPath } from "@/lib/server/security";
import { createServerAnonClient } from "@/lib/server/supabaseAdmin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code")?.trim() || null;
  const rawNext = searchParams.get("next") ?? searchParams.get("redirect");
  const safePath = validateSafeRedirectPath(rawNext);
  const destinationUrl = new URL(safePath, origin);

  if (!code) {
    return NextResponse.redirect(destinationUrl);
  }

  try {
    const supabase = createServerAnonClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    const response = NextResponse.redirect(destinationUrl);
    if (!error && data?.session?.access_token) {
      response.cookies.set(AUTH_COOKIE_NAME, data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }
    return response;
  } catch {
    return NextResponse.redirect(destinationUrl);
  }
}
