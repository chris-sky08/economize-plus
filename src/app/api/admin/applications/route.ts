import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, ServerAuthError } from "@/lib/server/auth";
import { sanitizeText, validateSameOrigin } from "@/lib/server/security";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";

type ApplicationCollection =
  | "partner_applications"
  | "couriers"
  | "price_reports";

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    const db = createServiceRoleClient(adminUser.accessToken);

    const [partnersRes, couriersRes, reportsRes] = await Promise.all([
      db
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("couriers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("price_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    return NextResponse.json({
      success: true,
      partnerApplications: partnersRes.data || [],
      couriers: couriersRes.data || [],
      priceReports: reportsRes.data || [],
    });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Erro ao consultar solicitações administrativas." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  try {
    const adminUser = await requireAdmin(request);
    const body = (await request.json().catch(() => ({}))) as {
      collection?: ApplicationCollection;
      id?: string;
      status?: string;
      notes?: string;
    };

    const collection = body.collection;
    const id = sanitizeText(body.id, 80);
    const status = sanitizeText(body.status, 40);

    if (
      !id ||
      !status ||
      (collection !== "partner_applications" &&
        collection !== "couriers" &&
        collection !== "price_reports")
    ) {
      return NextResponse.json(
        {
          error:
            "Informe a coleção (partner_applications, couriers ou price_reports), o ID e o novo status.",
        },
        { status: 400 }
      );
    }

    const allowedStatusesByCollection: Record<
      ApplicationCollection,
      ReadonlyArray<string>
    > = {
      partner_applications: ["em_analise", "aprovado", "recusado"],
      couriers: ["pre_cadastro", "em_analise", "aprovado", "suspenso"],
      price_reports: ["pendente", "revisado", "arquivado"],
    };

    if (!allowedStatusesByCollection[collection].includes(status)) {
      return NextResponse.json(
        { error: `Status '${status}' inválido para ${collection}.` },
        { status: 400 }
      );
    }

    const db = createServiceRoleClient(adminUser.accessToken);
    const { data, error } = await db
      .from(collection)
      .update({ status })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record: data });
  } catch (err: unknown) {
    if (err instanceof ServerAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Erro ao atualizar solicitação administrativa." },
      { status: 500 }
    );
  }
}
