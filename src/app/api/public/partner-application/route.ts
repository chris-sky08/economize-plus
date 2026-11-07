import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/server/auth";
import { checkRateLimit, getClientIp } from "@/lib/server/rateLimit";
import {
  sanitizeText,
  validateCnpj,
  validateSameOrigin,
} from "@/lib/server/security";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import { verifyTurnstileToken } from "@/lib/server/turnstile";

export async function POST(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  const rate = checkRateLimit(request, "public_partner_application", 5, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Muitas solicitações enviadas em sequência. Aguarde ${rate.retryAfterSeconds}s antes de tentar novamente.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      marketName?: string;
      cnpj?: string | null;
      responsibleName?: string;
      email?: string;
      phone?: string;
      address?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      desiredPlan?: "basico" | "premium";
      turnstileToken?: string;
    };

    const captcha = await verifyTurnstileToken(
      body.turnstileToken,
      getClientIp(request)
    );
    if (!captcha.valid) {
      return NextResponse.json(
        { error: captcha.error || "Falha na verificação de segurança." },
        { status: 400 }
      );
    }

    const marketName = sanitizeText(body.marketName, 140);
    const responsibleName = sanitizeText(body.responsibleName, 120);
    const email = sanitizeText(body.email, 140).toLowerCase();
    const phone = sanitizeText(body.phone, 30);
    const address = sanitizeText(body.address, 200);
    const neighborhood = sanitizeText(body.neighborhood, 100);
    const city = sanitizeText(body.city, 100);
    const state = sanitizeText(body.state || "SP", 2).toUpperCase() || "SP";
    const zipCode = sanitizeText(body.zipCode, 20);
    const desiredPlan = body.desiredPlan === "premium" ? "premium" : "basico";

    if (
      marketName.length < 2 ||
      responsibleName.length < 2 ||
      !email.includes("@") ||
      !phone ||
      !address ||
      !neighborhood ||
      !city ||
      !zipCode
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha todos os campos obrigatórios do estabelecimento com dados válidos.",
        },
        { status: 400 }
      );
    }

    let formattedCnpj: string | null = null;
    if (body.cnpj && String(body.cnpj).trim()) {
      const cnpjCheck = validateCnpj(String(body.cnpj));
      if (!cnpjCheck.valid) {
        return NextResponse.json(
          {
            error:
              cnpjCheck.reason ||
              "CNPJ inválido. Verifique os 14 dígitos numéricos.",
          },
          { status: 400 }
        );
      }
      formattedCnpj = cnpjCheck.formatted;
    }

    const token = extractTokenFromRequest(request);
    const db = createServiceRoleClient(token || undefined);

    const baseRow: Record<string, unknown> = {
      market_name: marketName,
      responsible_name: responsibleName,
      email,
      phone,
      address,
      neighborhood,
      city,
      zip_code: zipCode,
      desired_plan: desiredPlan,
    };

    const insertRow: Record<string, unknown> = formattedCnpj
      ? { ...baseRow, cnpj: formattedCnpj }
      : baseRow;

    let { error } = await db.from("partner_applications").insert(insertRow);

    if (error && /cnpj/i.test(error.message)) {
      const retryNoCnpj = await db.from("partner_applications").insert(baseRow);
      error = retryNoCnpj.error;
    }

    if (error && /state/i.test(error.message)) {
      const retryWithState = await db
        .from("partner_applications")
        .insert({ ...baseRow, state });
      error = retryWithState.error;
    }

    if (error) {
      return NextResponse.json(
        { error: `Erro ao registrar solicitação: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro ao processar solicitação de parceria.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
