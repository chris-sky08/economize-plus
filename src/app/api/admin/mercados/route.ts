import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ServerAuthError } from "@/lib/server/auth";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = (await request.json()) as {
      name?: string;
      cnpj?: string | null;
      responsibleName?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string | null;
      lat?: number | null;
      lng?: number | null;
      openingHours?: string | null;
      isPartner?: boolean;
      verified?: boolean;
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

    const db = createServiceRoleClient();
    const { data, error } = await db
      .from("supermarkets")
      .insert({
        id,
        name,
        cnpj: body.cnpj?.trim() || null,
        responsible_name: body.responsibleName?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        address,
        neighborhood,
        city,
        state,
        zip_code: body.zipCode?.trim() || null,
        lat: typeof body.lat === "number" && !Number.isNaN(body.lat) ? body.lat : null,
        lng: typeof body.lng === "number" && !Number.isNaN(body.lng) ? body.lng : null,
        is_partner: Boolean(body.isPartner),
        opening_hours: body.openingHours?.trim() || null,
        status: "ativo",
        verified_at: body.verified ? nowIso : null,
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
