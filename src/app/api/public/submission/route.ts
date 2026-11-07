import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/server/auth";
import { checkRateLimit, getClientIp } from "@/lib/server/rateLimit";
import {
  sanitizeText,
  validateCnpj,
  validateSafeHttpUrl,
  validateSameOrigin,
} from "@/lib/server/security";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";

type PublicSubmissionType = "partner" | "courier" | "price_report";

export async function POST(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  const rate = checkRateLimit(request, "public_form_submission", 6, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Muitas solicitações enviadas em sequência. Aguarde ${rate.retryAfterSeconds}s antes de tentar novamente.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as {
      type?: PublicSubmissionType;
      turnstileToken?: string;
      payload?: Record<string, unknown>;
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

    const payload = body.payload || {};
    const token = extractTokenFromRequest(request);
    const db = createServiceRoleClient(token || undefined);

    if (body.type === "partner") {
      const marketName = sanitizeText(payload.marketName, 140);
      const responsibleName = sanitizeText(payload.responsibleName, 120);
      const email = sanitizeText(payload.email, 140).toLowerCase();
      const phone = sanitizeText(payload.phone, 30);
      const address = sanitizeText(payload.address, 200);
      const neighborhood = sanitizeText(payload.neighborhood, 100);
      const city = sanitizeText(payload.city, 100);
      const zipCode = sanitizeText(payload.zipCode, 20);
      const state = sanitizeText(payload.state || "SP", 2).toUpperCase() || "SP";
      const desiredPlan =
        payload.desiredPlan === "premium" ? "premium" : "basico";

      if (payload.cnpj && String(payload.cnpj).trim()) {
        const cnpjCheck = validateCnpj(String(payload.cnpj));
        if (!cnpjCheck.valid) {
          return NextResponse.json(
            { error: cnpjCheck.reason || "CNPJ inválido." },
            { status: 400 }
          );
        }
      }

      if (
        !marketName ||
        !responsibleName ||
        !email ||
        !phone ||
        !address ||
        !neighborhood ||
        !city ||
        !zipCode
      ) {
        return NextResponse.json(
          { error: "Preencha todos os campos obrigatórios do estabelecimento." },
          { status: 400 }
        );
      }

      const baseRow = {
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

      let { error } = await db.from("partner_applications").insert(baseRow);

      if (error && /state/i.test(error.message)) {
        const retryRes = await db
          .from("partner_applications")
          .insert({ ...baseRow, state });
        error = retryRes.error;
      }

      if (error) {
        return NextResponse.json(
          { error: `Erro ao registrar solicitação: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (body.type === "courier") {
      const fullName = sanitizeText(payload.fullName, 120);
      const email = sanitizeText(payload.email, 140).toLowerCase();
      const phone = sanitizeText(payload.phone, 30);
      const rawVehicle = sanitizeText(payload.vehicleType || "moto", 20);
      const vehicleType =
        rawVehicle === "bicicleta" ||
        rawVehicle === "moto" ||
        rawVehicle === "carro" ||
        rawVehicle === "utilitario"
          ? rawVehicle
          : "moto";
      const serviceNeighborhoods = Array.isArray(payload.serviceNeighborhoods)
        ? payload.serviceNeighborhoods
            .map((s) => sanitizeText(s, 80))
            .filter(Boolean)
            .slice(0, 25)
        : [];

      if (!fullName || !email || !phone || serviceNeighborhoods.length === 0) {
        return NextResponse.json(
          {
            error:
              "Preencha nome, e-mail, telefone e ao menos um bairro de atuação.",
          },
          { status: 400 }
        );
      }

      const { error } = await db.from("couriers").insert({
        full_name: fullName,
        email,
        phone,
        vehicle_type: vehicleType,
        service_neighborhoods: serviceNeighborhoods,
      });

      if (error) {
        return NextResponse.json(
          { error: `Erro ao registrar cadastro: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (body.type === "price_report") {
      const marketId = sanitizeText(payload.marketId, 80);
      const productId = sanitizeText(payload.productId, 80);
      const reason = sanitizeText(payload.reason, 160);
      const details = sanitizeText(payload.details, 600);

      if (payload.proofUrl && String(payload.proofUrl).trim()) {
        const safeProof = validateSafeHttpUrl(payload.proofUrl);
        if (!safeProof) {
          return NextResponse.json(
            {
              error:
                "URL de comprovante inválida ou bloqueada por proteção SSRF.",
            },
            { status: 400 }
          );
        }
      }

      if (!marketId || !productId || !reason) {
        return NextResponse.json(
          { error: "Informe o mercado, o produto e o motivo da divergência." },
          { status: 400 }
        );
      }

      const { error } = await db.from("price_reports").insert({
        supermarket_id: marketId,
        product_id: productId,
        reason,
        details: details || null,
      });

      if (error) {
        return NextResponse.json(
          { error: `Erro ao registrar relato: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Tipo de formulário inválido." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao processar envio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
