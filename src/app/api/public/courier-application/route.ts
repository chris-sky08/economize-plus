import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/server/auth";
import { checkRateLimit, getClientIp } from "@/lib/server/rateLimit";
import { sanitizeText, validateSameOrigin } from "@/lib/server/security";
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

  const rate = checkRateLimit(request, "public_courier_application", 5, 60_000);
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
      fullName?: string;
      email?: string;
      phone?: string;
      vehicleType?: string;
      serviceNeighborhoods?: unknown[];
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

    const fullName = sanitizeText(body.fullName, 120);
    const email = sanitizeText(body.email, 140).toLowerCase();
    const phone = sanitizeText(body.phone, 30);
    const rawVehicle = sanitizeText(body.vehicleType || "moto", 20);
    const vehicleType =
      rawVehicle === "bicicleta" ||
      rawVehicle === "moto" ||
      rawVehicle === "carro" ||
      rawVehicle === "utilitario"
        ? rawVehicle
        : "moto";

    const serviceNeighborhoods = Array.isArray(body.serviceNeighborhoods)
      ? body.serviceNeighborhoods
          .map((item) => sanitizeText(item, 80))
          .filter(Boolean)
          .slice(0, 25)
      : [];

    if (
      fullName.length < 2 ||
      !email.includes("@") ||
      !phone ||
      serviceNeighborhoods.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha nome completo, e-mail válido, telefone e ao menos um bairro de atuação.",
        },
        { status: 400 }
      );
    }

    const token = extractTokenFromRequest(request);
    const db = createServiceRoleClient(token || undefined);

    const { error } = await db.from("couriers").insert({
      full_name: fullName,
      email,
      phone,
      vehicle_type: vehicleType,
      service_neighborhoods: serviceNeighborhoods,
    });

    if (error) {
      return NextResponse.json(
        { error: `Erro ao registrar cadastro de entregador: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro ao processar pré-cadastro de entregador.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
