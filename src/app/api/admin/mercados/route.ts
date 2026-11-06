import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ServerAuthError } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);

    const body = (await request.json()) as {
      name?: string;
      cnpj?: string | null;
      responsibleName?: string | null;
      responsible_name?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string | null;
      zip_code?: string | null;
      lat?: number | null;
      lng?: number | null;
      openingHours?: string | null;
      opening_hours?: string | null;
      isPartner?: boolean;
      is_partner?: boolean;
      verified?: boolean;
      mark_verified?: boolean;
    };

    const name = (body.name || "").trim();
    const address = (body.address || "").trim();
    const neighborhood = (body.neighborhood || "").trim();
    const city = (body.city || "").trim();
    const state = (body.state || "").trim().toUpperCase();

    if (!name || !address || !neighborhood || !city || !state) {
      return NextResponse.json(
        {
          error:
            "Preencha nome, endereço, bairro, cidade e UF do supermercado.",
        },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 36);
    const id = `${slug}-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    const responsibleName =
      (body.responsibleName ?? body.responsible_name ?? "")?.trim() || null;
    const zipCode = (body.zipCode ?? body.zip_code ?? "")?.trim() || null;
    const openingHours =
      (body.openingHours ?? body.opening_hours ?? "")?.trim() || null;
    const isPartner = Boolean(body.isPartner ?? body.is_partner);
    const isVerified = Boolean(body.verified ?? body.mark_verified);

    const db = createServiceRoleClient(adminUser.accessToken);
    const { data, error } = await db
      .from("supermarkets")
      .insert({
        id,
        name,
        cnpj: body.cnpj?.trim() || null,
        responsible_name: responsibleName,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        address,
        neighborhood,
        city,
        state,
        zip_code: zipCode,
        lat:
          typeof body.lat === "number" && !Number.isNaN(body.lat)
            ? body.lat
            : null,
        lng:
          typeof body.lng === "number" && !Number.isNaN(body.lng)
            ? body.lng
            : null,
        is_partner: isPartner,
        opening_hours: openingHours,
        status: "ativo",
        verified_at: isVerified ? nowIso : null,
        updated_at: nowIso,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, supermarket: data });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Erro ao cadastrar supermercado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);

    const body = (await request.json()) as {
      id?: string;
      action?: "verify" | "unverify" | "toggle_status";
      status?: "ativo" | "suspenso" | "pendente" | "inativo";
    };

    const marketId = (body.id || "").trim();
    if (!marketId) {
      return NextResponse.json(
        { error: "Informe o identificador do supermercado." },
        { status: 400 }
      );
    }

    const db = createServiceRoleClient(adminUser.accessToken);
    const nowIso = new Date().toISOString();
    const updates: Record<string, unknown> = {
      updated_at: nowIso,
    };

    if (body.action === "verify") {
      updates.verified_at = nowIso;
    } else if (body.action === "unverify") {
      updates.verified_at = null;
    } else if (body.action === "toggle_status" || body.status) {
      const normalizedStatus =
        body.status === "ativo"
          ? "ativo"
          : body.status === "pendente"
            ? "pendente"
            : "suspenso";
      updates.status = normalizedStatus;
    }

    const { data, error } = await db
      .from("supermarkets")
      .update(updates)
      .eq("id", marketId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, supermarket: data });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message =
      err instanceof Error ? err.message : "Erro ao atualizar supermercado.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
