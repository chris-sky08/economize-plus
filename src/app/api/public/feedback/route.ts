import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromRequest } from "@/lib/server/auth";
import { checkRateLimit, getClientIp } from "@/lib/server/rateLimit";
import {
  sanitizeText,
  validateSafeRedirectPath,
  validateSameOrigin,
} from "@/lib/server/security";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { createServiceRoleClient } from "@/lib/server/supabaseAdmin";
import type { FeedbackCategory } from "@/types/domain";

const OFFICIAL_GMAIL = "empresaeconomizemais@gmail.com";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  sugestao: "💡 Sugestão de Melhoria",
  bug: "🐛 Relatar um Bug",
  indicar_mercado: "🏪 Indicar Mercado",
  duvida: "💬 Dúvida / Conversa Conosco",
};

function isValidCategory(val: unknown): val is FeedbackCategory {
  return (
    val === "sugestao" ||
    val === "bug" ||
    val === "indicar_mercado" ||
    val === "duvida"
  );
}

async function dispatchFeedbackToGmail(params: {
  protocolId: string;
  rating: number;
  category: FeedbackCategory;
  categoryLabel: string;
  message: string;
  senderName: string | null;
  senderContact: string | null;
  pagePath: string;
  submittedAtBr: string;
}): Promise<boolean> {
  const stars = "⭐".repeat(params.rating);
  const subject = `[Economize+ Feedback] ${params.categoryLabel} — ${stars} (${params.rating}/5)`;

  // 1. Se houver RESEND_API_KEY configurada no ambiente, envia HTML instantâneo
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Economize+ Feedback <onboarding@resend.dev>",
          to: [OFFICIAL_GMAIL],
          subject,
          text: [
            `Protocolo: ${params.protocolId}`,
            `Categoria: ${params.categoryLabel}`,
            `Avaliação: ${stars} (${params.rating} de 5 estrelas)`,
            `Nome: ${params.senderName || "Não informado"}`,
            `Contato: ${params.senderContact || "Não informado"}`,
            `Página de origem: ${params.pagePath}`,
            `Data/Hora: ${params.submittedAtBr}`,
            "",
            "Mensagem do Usuário:",
            params.message,
          ].join("\n"),
        }),
      });
      if (res.ok) {
        return true;
      }
    } catch {
      // Continua para o canal FormSubmit
    }
  }

  // 2. Disparo automático via FormSubmit AJAX direto para empresaeconomizemais@gmail.com
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(
      `https://formsubmit.co/ajax/${OFFICIAL_GMAIL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://economize-nine.vercel.app",
          Referer: "https://economize-nine.vercel.app/",
        },
        body: JSON.stringify({
          _subject: subject,
          _template: "table",
          _captcha: "false",
          Protocolo: params.protocolId,
          Categoria: params.categoryLabel,
          Avaliacao: `${stars} (${params.rating} de 5 estrelas)`,
          Nome: params.senderName || "Visitante (não informado)",
          Contato: params.senderContact || "Não informado",
          Pagina_Origem: `https://economize-nine.vercel.app${params.pagePath}`,
          Data_Hora_Coleta: params.submittedAtBr,
          Mensagem: params.message,
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (response.ok) {
      return true;
    }
  } catch {
    // Silencioso: mantém registro no banco e retorna links diretos de apoio
  }

  return false;
}

export async function POST(request: NextRequest) {
  const originCheck = validateSameOrigin(request);
  if (!originCheck.ok) {
    return NextResponse.json(
      { error: originCheck.reason || "Requisição bloqueada por proteção CSRF." },
      { status: 403 }
    );
  }

  const rate = checkRateLimit(request, "public_feedback_submission", 6, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Muitas avaliações enviadas em sequência. Aguarde ${rate.retryAfterSeconds}s antes de tentar novamente.`,
      },
      { status: 429 }
    );
  }

  try {
    const rawText = await request.text();
    if (rawText.length > 16_000) {
      return NextResponse.json(
        { error: "Payload excede o limite de segurança permitido." },
        { status: 413 }
      );
    }

    const body = JSON.parse(rawText) as {
      rating?: unknown;
      category?: unknown;
      message?: unknown;
      senderName?: unknown;
      senderContact?: unknown;
      pagePath?: unknown;
      turnstileToken?: string;
    };

    const captcha = await verifyTurnstileToken(
      body.turnstileToken,
      getClientIp(request)
    );
    if (!captcha.valid) {
      return NextResponse.json(
        { error: captcha.error || "Falha na verificação anti-bot." },
        { status: 400 }
      );
    }

    const numericRating = Number(body.rating);
    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        { error: "Escolha uma nota de 1 a 5 estrelas para enviar sua avaliação." },
        { status: 400 }
      );
    }

    const category: FeedbackCategory = isValidCategory(body.category)
      ? body.category
      : "sugestao";

    const message = sanitizeText(body.message, 1500);
    if (!message || message.length < 5) {
      return NextResponse.json(
        {
          error:
            "Escreva pelo menos 5 caracteres descrevendo sua opinião, sugestão ou o bug encontrado.",
        },
        { status: 400 }
      );
    }

    const senderName = sanitizeText(body.senderName, 120) || null;
    const senderContact = sanitizeText(body.senderContact, 160) || null;
    const pagePath = validateSafeRedirectPath(
      typeof body.pagePath === "string" ? body.pagePath : "/"
    );

    const now = new Date();
    const submittedAtBr = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(now);

    const protocolId = `ECO-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const categoryLabel = CATEGORY_LABELS[category];

    const emailDispatched = await dispatchFeedbackToGmail({
      protocolId,
      rating: numericRating,
      category,
      categoryLabel,
      message,
      senderName,
      senderContact,
      pagePath,
      submittedAtBr,
    });

    // Salva também no Supabase (tabela user_feedback) se configurada
    let savedToDb = false;
    try {
      const token = extractTokenFromRequest(request);
      const db = createServiceRoleClient(token || undefined);
      const { error } = await db.from("user_feedback").insert({
        rating: numericRating,
        category,
        message,
        sender_name: senderName,
        sender_contact: senderContact,
        page_path: pagePath,
        email_dispatched: emailDispatched,
        status: "novo",
      });
      if (!error) {
        savedToDb = true;
      }
    } catch {
      // Caso a migration ainda não tenha sido aplicada no banco remoto, não interrompe o envio ao Gmail
    }

    const stars = "⭐".repeat(numericRating);
    const subject = `[Economize+ Feedback] ${categoryLabel} — ${stars} (${numericRating}/5)`;
    const emailBody = [
      `Protocolo: ${protocolId}`,
      `Categoria: ${categoryLabel}`,
      `Nota: ${stars} (${numericRating}/5)`,
      `Nome: ${senderName || "Não informado"}`,
      `Contato: ${senderContact || "Não informado"}`,
      `Página: https://economize-nine.vercel.app${pagePath}`,
      `Data/Hora: ${submittedAtBr}`,
      "",
      "Mensagem:",
      message,
    ].join("\n");

    const mailtoUrl = `mailto:${OFFICIAL_GMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      OFFICIAL_GMAIL
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    return NextResponse.json({
      success: true,
      protocolId,
      emailDispatched,
      savedToDb,
      targetEmail: OFFICIAL_GMAIL,
      submittedAtBr,
      mailtoUrl,
      gmailComposeUrl,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao enviar avaliação.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
