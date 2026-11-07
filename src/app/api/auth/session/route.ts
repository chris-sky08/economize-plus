import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  requireUser,
  ServerAuthError,
} from "@/lib/server/auth";
import { validateSameOrigin } from "@/lib/server/security";

export async function POST(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      accessToken?: string;
    };
    const token = (body.accessToken || "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Token de acesso não informado." },
        { status: 400 }
      );
    }

    const headers = new Headers(request.headers);
    headers.set("authorization", `Bearer ${token}`);
    const reqWithAuth = new NextRequest(request.url, {
      method: "POST",
      headers,
    });

    const user = await requireUser(reqWithAuth);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName || user.email.split("@")[0] || "Usuário",
        role: user.role,
        supermarketIds: user.supermarketIds,
        marketId: user.supermarketIds[0] || undefined,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error ? err.message : "Erro ao validar sessão no servidor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
