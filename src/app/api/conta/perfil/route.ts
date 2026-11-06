import { NextRequest, NextResponse } from "next/server";
import { requireUser, ServerAuthError } from "@/lib/server/auth";
import {
  createServerAnonClient,
  createServiceRoleClient,
} from "@/lib/server/supabaseAdmin";
import type { UserRole } from "@/types/domain";

export interface ConsumerProfileRecord {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  cep: string | null;
  lgpd_consent: boolean;
  lgpd_consent_at: string | null;
  app_role: UserRole;
  created_at: string | null;
}

interface RawProfileRow {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  cep?: string | null;
  lgpd_consent?: boolean | null;
  lgpd_consent_at?: string | null;
  app_role?: string | null;
  created_at?: string | null;
}

interface PatchProfilePayload {
  full_name?: string;
  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  cep?: string | null;
  lgpd_consent?: boolean;
}

function normalizeNullableText(value: unknown, maxLen = 120): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCep(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return null;
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

function normalizeRole(value: unknown, fallback: UserRole): UserRole {
  if (
    value === "consumidor" ||
    value === "mercado" ||
    value === "entregador" ||
    value === "admin"
  ) {
    return value;
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireUser(request);
    const supabaseAdmin = createServiceRoleClient();

    let row: RawProfileRow | null = null;

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, full_name, email, phone, city, neighborhood, cep, lgpd_consent, lgpd_consent_at, app_role, created_at"
      )
      .eq("id", authUser.id)
      .maybeSingle();

    if (!error && data) {
      row = data as RawProfileRow;
    } else {
      const fallbackRes = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();
      if (fallbackRes.data) {
        row = fallbackRes.data as RawProfileRow;
      }
    }

    // Busca metadados em auth.users caso alguma coluna de public.profiles esteja vazia
    const anonClient = createServerAnonClient(authUser.accessToken);
    const { data: authData } = await anonClient.auth.getUser(
      authUser.accessToken
    );
    const meta: Record<string, unknown> =
      authData?.user?.user_metadata &&
      typeof authData.user.user_metadata === "object"
        ? (authData.user.user_metadata as Record<string, unknown>)
        : {};

    const profile: ConsumerProfileRecord = {
      id: authUser.id,
      full_name:
        normalizeNullableText(row?.full_name) ??
        normalizeNullableText(meta.full_name) ??
        authUser.fullName,
      email: normalizeNullableText(row?.email) ?? authUser.email,
      phone:
        normalizeNullableText(row?.phone, 30) ??
        normalizeNullableText(meta.phone, 30),
      city:
        normalizeNullableText(row?.city, 80) ??
        normalizeNullableText(meta.city, 80),
      neighborhood:
        normalizeNullableText(row?.neighborhood, 80) ??
        normalizeNullableText(meta.neighborhood, 80),
      cep: normalizeCep(row?.cep) ?? normalizeCep(meta.cep),
      lgpd_consent:
        typeof row?.lgpd_consent === "boolean"
          ? row.lgpd_consent
          : typeof meta.lgpd_consent === "boolean"
            ? meta.lgpd_consent
            : true,
      lgpd_consent_at:
        typeof row?.lgpd_consent_at === "string" ? row.lgpd_consent_at : null,
      app_role: normalizeRole(row?.app_role, authUser.role),
      created_at:
        typeof row?.created_at === "string"
          ? row.created_at
          : authData?.user?.created_at ?? null,
    };

    return NextResponse.json({ profile });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error
        ? err.message
        : "Não foi possível carregar os dados do perfil.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireUser(request);
    const body = (await request.json().catch(() => ({}))) as PatchProfilePayload;

    const fullName = normalizeNullableText(body.full_name, 120);
    if (!fullName) {
      return NextResponse.json(
        { error: "Informe seu nome completo para atualizar o cadastro." },
        { status: 400 }
      );
    }

    const phone = normalizeNullableText(body.phone, 30);
    const city = normalizeNullableText(body.city, 80);
    const neighborhood = normalizeNullableText(body.neighborhood, 80);
    const cep = normalizeCep(body.cep);
    const lgpdConsent =
      typeof body.lgpd_consent === "boolean" ? body.lgpd_consent : true;
    const nowIso = new Date().toISOString();

    const supabaseAdmin = createServiceRoleClient();

    const fullUpdatePayload = {
      id: authUser.id,
      full_name: fullName,
      email: authUser.email,
      phone,
      city,
      neighborhood,
      cep,
      lgpd_consent: lgpdConsent,
      lgpd_consent_at: nowIso,
      updated_at: nowIso,
    };

    const { error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(fullUpdatePayload, { onConflict: "id" });

    if (upsertErr) {
      // Caso a migration 0002 ainda não tenha sido rodada no banco remoto, garante atualização de full_name
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", authUser.id);
    }

    // Sincroniza também os metadados do usuário no Supabase Auth
    const anonClient = createServerAnonClient(authUser.accessToken);
    await anonClient.auth.updateUser({
      data: {
        full_name: fullName,
        phone,
        city,
        neighborhood,
        cep,
        lgpd_consent: lgpdConsent,
      },
    });

    const profile: ConsumerProfileRecord = {
      id: authUser.id,
      full_name: fullName,
      email: authUser.email,
      phone,
      city,
      neighborhood,
      cep,
      lgpd_consent: lgpdConsent,
      lgpd_consent_at: nowIso,
      app_role: authUser.role,
      created_at: null,
    };

    return NextResponse.json({
      ok: true,
      profile,
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error
        ? err.message
        : "Não foi possível salvar suas alterações de perfil.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
