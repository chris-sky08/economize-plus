import { NextRequest } from "next/server";
import {
  createServerAnonClient,
  createServiceRoleClient,
} from "@/lib/server/supabaseAdmin";
import type { UserRole } from "@/types/domain";

export const AUTH_COOKIE_NAME = "economize_access_token";

export interface AuthenticatedServerUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  supermarketIds: string[];
  accessToken: string;
}

export class ServerAuthError extends Error {
  public readonly status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value?.trim();
  if (cookieToken) return cookieToken;
  return null;
}

export async function requireUser(
  request: NextRequest
): Promise<AuthenticatedServerUser> {
  const token = extractTokenFromRequest(request);
  if (!token) {
    throw new ServerAuthError(
      "Autenticação obrigatória. Faça login para continuar.",
      401
    );
  }

  const anonClient = createServerAnonClient(token);
  const { data: userData, error: userErr } = await anonClient.auth.getUser(token);

  if (userErr || !userData?.user) {
    throw new ServerAuthError(
      "Sessão expirada ou token inválido. Faça login novamente.",
      401
    );
  }

  const user = userData.user;
  const dbClient = createServiceRoleClient(token);

  const [profileRes, membersRes] = await Promise.all([
    dbClient
      .from("profiles")
      .select("full_name, app_role")
      .eq("id", user.id)
      .maybeSingle(),
    dbClient
      .from("market_members")
      .select("supermarket_id")
      .eq("user_id", user.id),
  ]);

  const rawRole = profileRes.data?.app_role;
  const isDefaultAdminEmail =
    (user.email || "").trim().toLowerCase() === "skyleywinfoster@gmail.com";

  const role: UserRole =
    rawRole === "admin" ||
    rawRole === "mercado" ||
    rawRole === "entregador" ||
    rawRole === "consumidor"
      ? rawRole
      : isDefaultAdminEmail
        ? "admin"
        : "consumidor";

  const supermarketIds: string[] = Array.isArray(membersRes.data)
    ? membersRes.data
        .map((m) => String(m.supermarket_id || "").trim())
        .filter(Boolean)
    : [];

  const metaFullName =
    user.user_metadata &&
    typeof user.user_metadata === "object" &&
    typeof (user.user_metadata as Record<string, unknown>).full_name === "string"
      ? String((user.user_metadata as Record<string, unknown>).full_name).trim()
      : null;

  return {
    id: user.id,
    email: user.email || "",
    fullName:
      typeof profileRes.data?.full_name === "string" &&
      profileRes.data.full_name.trim()
        ? profileRes.data.full_name.trim()
        : metaFullName,
    role,
    supermarketIds,
    accessToken: token,
  };
}

export async function requireAdmin(
  request: NextRequest
): Promise<AuthenticatedServerUser> {
  const authUser = await requireUser(request);
  if (authUser.role !== "admin") {
    throw new ServerAuthError(
      "Acesso negado: esta operação exige perfil de administrador validado em public.profiles.",
      403
    );
  }
  return authUser;
}

export async function requireMarketMember(
  request: NextRequest,
  requestedSupermarketId?: string | null
): Promise<{ user: AuthenticatedServerUser; supermarketId: string }> {
  const authUser = await requireUser(request);

  if (authUser.role === "admin") {
    const cleanRequested = requestedSupermarketId?.trim();
    if (cleanRequested) {
      return {
        user: authUser,
        supermarketId: cleanRequested,
      };
    }
    if (authUser.supermarketIds.length > 0) {
      return {
        user: authUser,
        supermarketId: authUser.supermarketIds[0],
      };
    }
    const dbClient = createServiceRoleClient(authUser.accessToken);
    const { data: firstMarket } = await dbClient
      .from("supermarkets")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      user: authUser,
      supermarketId: firstMarket?.id ? String(firstMarket.id) : "",
    };
  }

  if (authUser.supermarketIds.length === 0) {
    throw new ServerAuthError(
      "Acesso negado: sua conta não possui vínculo em public.market_members com nenhum mercado parceiro.",
      403
    );
  }

  if (requestedSupermarketId && requestedSupermarketId.trim()) {
    const cleanId = requestedSupermarketId.trim();
    if (!authUser.supermarketIds.includes(cleanId)) {
      throw new ServerAuthError(
        "Acesso negado: você não tem permissão para alterar dados deste mercado.",
        403
      );
    }
    return { user: authUser, supermarketId: cleanId };
  }

  return {
    user: authUser,
    supermarketId: authUser.supermarketIds[0],
  };
}
