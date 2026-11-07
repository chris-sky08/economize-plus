import "server-only";

interface TurnstileVerifyResponse {
  success?: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<{ valid: boolean; error?: string }> {
  const secretKey = (process.env.TURNSTILE_SECRET_KEY || "").trim();

  if (!secretKey) {
    // Quando TURNSTILE_SECRET_KEY não está configurada no ambiente, permite o envio
    // protegido pelo rate-limit de IP da rota de servidor (/api/public/submission).
    return { valid: true };
  }

  if (!token || !token.trim()) {
    return {
      valid: false,
      error: "Confirme a verificação de segurança (Cloudflare Turnstile) antes de enviar.",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!res.ok) {
      return {
        valid: false,
        error: "Não foi possível validar o desafio anti-bot no momento.",
      };
    }

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      return {
        valid: false,
        error: "Verificação de segurança inválida ou expirada. Tente novamente.",
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: "Falha de comunicação ao verificar o desafio de segurança.",
    };
  }
}
