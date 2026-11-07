import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/server/auth";
import { checkRateLimit, getClientIp } from "@/lib/server/rateLimit";
import {
  sanitizeText,
  validateSafeHttpUrl,
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

  const rate = checkRateLimit(request, "public_price_report", 6, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Muitos relatos enviados em sequência. Aguarde ${rate.retryAfterSeconds}s antes de tentar novamente.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      marketId?: string;
      supermarket_id?: string;
      productId?: string;
      product_id?: string;
      reason?: string;
      details?: string | null;
      proofUrl?: string | null;
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

    const marketId = sanitizeText(body.marketId ?? body.supermarket_id, 80);
    const productId = sanitizeText(body.productId ?? body.product_id, 80);
    const reason = sanitizeText(body.reason, 160);
    const rawDetails = sanitizeText(body.details, 600);

    if (!marketId || !productId || reason.length < 3) {
      return NextResponse.json(
        {
          error:
            "Informe o mercado, o produto e o motivo da divergência (mínimo 3 caracteres).",
        },
        { status: 400 }
      );
    }

    let safeProofUrl: string | null = null;
    if (body.proofUrl && String(body.proofUrl).trim()) {
      safeProofUrl = validateSafeHttpUrl(body.proofUrl);
      if (!safeProofUrl) {
        return NextResponse.json(
          {
            error:
              "A URL de comprovante (proofUrl) é inválida ou bloqueada por proteção SSRF. Utilize apenas links HTTPS públicos válidos.",
          },
          { status: 400 }
        );
      }
    }

    const composedDetails = [
      rawDetails || null,
      safeProofUrl ? `Comprovante: ${safeProofUrl}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const token = extractTokenFromRequest(request);
    const db = createServiceRoleClient(token || undefined);

    const { error } = await db.from("price_reports").insert({
      supermarket_id: marketId,
      product_id: productId,
      reason,
      details: composedDetails || null,
    });

    if (error) {
      return NextResponse.json(
        { error: `Erro ao registrar relato de preço: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Erro ao processar relato de divergência de preço.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
