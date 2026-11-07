import "server-only";

export interface SameOriginValidationResult {
  ok: boolean;
  reason?: string;
}

export interface GtinValidationResult {
  valid: boolean;
  normalized: string;
  reason?: string;
}

export interface MagicBytesValidationResult {
  valid: boolean;
  detectedMime: string | null;
  reason?: string;
}

export interface CnpjValidationResult {
  valid: boolean;
  normalized: string;
  formatted: string;
  reason?: string;
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isLocalhostHostname(hostname: string): boolean {
  const clean = hostname.toLowerCase();
  return clean === "localhost" || clean === "127.0.0.1" || clean === "[::1]";
}

function isOriginMatchingExpectedHost(
  candidateHost: string,
  candidateHostname: string,
  expectedHost: string
): boolean {
  const cleanCandidateHost = candidateHost.trim().toLowerCase();
  const cleanExpectedHost = expectedHost.trim().toLowerCase();

  if (!cleanCandidateHost || !cleanExpectedHost) {
    return false;
  }

  if (cleanCandidateHost === cleanExpectedHost) {
    return true;
  }

  // Em ambiente de desenvolvimento local, aceita localhost <-> 127.0.0.1 apenas se o Host também for local
  if (process.env.NODE_ENV !== "production") {
    const expectedHostname = cleanExpectedHost.split(":")[0] || "";
    if (
      isLocalhostHostname(candidateHostname) &&
      isLocalhostHostname(expectedHostname)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Valida os cabeçalhos Origin, Referer e Sec-Fetch-Site em requisições mutáveis
 * (POST, PUT, PATCH, DELETE) contra o Host / x-forwarded-host para bloquear CSRF.
 */
export function validateSameOrigin(request: Request): SameOriginValidationResult {
  const method = (request.method || "GET").toUpperCase();
  if (!MUTATING_METHODS.has(method)) {
    return { ok: true };
  }

  const secFetchSite = request.headers
    .get("sec-fetch-site")
    ?.trim()
    .toLowerCase();
  if (secFetchSite === "cross-site") {
    return {
      ok: false,
      reason: "Requisição cross-site bloqueada (Sec-Fetch-Site: cross-site).",
    };
  }

  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const hostHeader = request.headers.get("host")?.trim().toLowerCase();

  let urlHost = "";
  try {
    urlHost = new URL(request.url).host.toLowerCase();
  } catch {
    urlHost = "";
  }

  const expectedHost = forwardedHost || hostHeader || urlHost;
  if (!expectedHost) {
    return {
      ok: false,
      reason: "Cabeçalho Host ausente na requisição.",
    };
  }

  const originHeader = request.headers.get("origin")?.trim();
  if (originHeader) {
    if (originHeader.toLowerCase() === "null") {
      return {
        ok: false,
        reason: "Cabeçalho Origin 'null' bloqueado por proteção anti-CSRF.",
      };
    }

    let originUrl: URL;
    try {
      originUrl = new URL(originHeader);
    } catch {
      return {
        ok: false,
        reason: "Cabeçalho Origin malformado.",
      };
    }

    if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") {
      return {
        ok: false,
        reason: "Protocolo de Origin inválido.",
      };
    }

    if (
      !isOriginMatchingExpectedHost(
        originUrl.host,
        originUrl.hostname,
        expectedHost
      )
    ) {
      return {
        ok: false,
        reason: `Origem não autorizada (CSRF bloqueado): ${originUrl.host} não corresponde a ${expectedHost}.`,
      };
    }

    return { ok: true };
  }

  const refererHeader = request.headers.get("referer")?.trim();
  if (refererHeader) {
    let refererUrl: URL;
    try {
      refererUrl = new URL(refererHeader);
    } catch {
      return {
        ok: false,
        reason: "Cabeçalho Referer malformado.",
      };
    }

    if (refererUrl.protocol !== "http:" && refererUrl.protocol !== "https:") {
      return {
        ok: false,
        reason: "Protocolo de Referer inválido.",
      };
    }

    if (
      !isOriginMatchingExpectedHost(
        refererUrl.host,
        refererUrl.hostname,
        expectedHost
      )
    ) {
      return {
        ok: false,
        reason: `Referer não autorizado (CSRF bloqueado): ${refererUrl.host} não corresponde a ${expectedHost}.`,
      };
    }

    return { ok: true };
  }

  if (
    process.env.NODE_ENV === "production" &&
    !request.headers.get("authorization")
  ) {
    return {
      ok: false,
      reason: "Cabeçalhos Origin e Referer ausentes em requisição mutável.",
    };
  }

  return { ok: true };
}

/**
 * Remove bytes nulos (\0), caracteres de controle, tags HTML/script (<script,
 * javascript:, data:text/html, onerror=, onload=) e limita o comprimento máximo.
 */
export function sanitizeText(input: unknown, maxLength: number = 500): string {
  if (input === null || input === undefined) {
    return "";
  }

  let raw: string;
  if (typeof input === "string") {
    raw = input;
  } else if (typeof input === "number" || typeof input === "boolean") {
    raw = String(input);
  } else {
    return "";
  }

  const safeLimit = Number.isFinite(maxLength) && maxLength > 0 ? maxLength : 500;

  let cleaned = raw
    // 1. Remove null bytes e caracteres de controle ASCII
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // 2. Remove blocos completos de <script>, <style>, <iframe>, <object>, <embed>, <svg>
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    // 3. Remove handlers de evento inline (onerror=, onload=, onclick=, onmouseover=, etc.)
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // 4. Remove quaisquer tags HTML restantes
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    // 5. Remove esquemas perigosos (javascript:, vbscript:, data:text/html) e o payload adjacente
    .replace(/(?:javascript|vbscript)\s*:[^\s]*/gi, "")
    .replace(/data\s*:\s*text\/html[^\s]*/gi, "")
    // 6. Remove colchetes angulares remanescentes e sequências de quebra de atributo XSS ("><)
    .replace(/[<>]/g, "");

  // Se sobrou apenas pontuação de tentativa de escape de atributo (ex: '""' ou '"\''), limpa
  if (/^["'`\s;]+$/.test(cleaned)) {
    return "";
  }

  cleaned = cleaned.replace(/[ \t]+/g, " ").trim();
  return cleaned.slice(0, safeLimit);
}

/**
 * Protege contra CSV Formula Injection (DDE / Excel / Calc injection)
 * removendo caracteres iniciais de fórmula (=, +, -, @, \t, \r) e comandos DDE.
 */
export function sanitizeCsvCell(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  let cleaned = sanitizeText(input, 500);

  // Remove caracteres iniciais que disparam fórmulas em Excel / LibreOffice / Google Sheets
  cleaned = cleaned.replace(/^[\s=+\-@\t\r\n|]+/, "");

  // Neutraliza payloads de execução DDE (ex: cmd|' /C calc'!A0, powershell|...)
  cleaned = cleaned.replace(
    /\b(?:cmd|powershell|wscript|cscript|mshta|sh|bash)\s*\|[^\r\n]*/gi,
    ""
  );

  // Neutraliza funções de planilha usadas em vetores de injeção/exfiltração
  cleaned = cleaned.replace(
    /\b(?:SUM|HYPERLINK|IMPORTXML|IMPORTDATA|IMPORTRANGE|IMPORTFEED|WEBSERVICE)\s*\([^)]*\)/gi,
    ""
  );

  // Remove resíduos iniciais de operadores matemáticos/fórmula após limpeza
  cleaned = cleaned.replace(/^[\s=+\-@\t\r\n|*!]+/, "");

  return cleaned.trim();
}

/**
 * Garante que caminhos de redirecionamento (ex: 'next' em /auth/callback)
 * iniciem com uma única '/' e nunca '//', '/\', 'http:', 'https:', 'javascript:'.
 */
export function validateSafeRedirectPath(nextParam: string | null): string {
  if (!nextParam || typeof nextParam !== "string") {
    return "/";
  }

  const stripped = nextParam.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (!stripped) {
    return "/";
  }

  let decoded = stripped;
  try {
    decoded = decodeURIComponent(stripped);
  } catch {
    return "/";
  }

  for (const candidate of [stripped, decoded]) {
    const trimmed = candidate.trim();
    if (!trimmed.startsWith("/")) {
      return "/";
    }
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/\\") ||
      trimmed.includes("\\")
    ) {
      return "/";
    }
    if (
      /^[a-zA-Z][a-zA-Z0-9+.-]*:/i.test(trimmed) ||
      /(?:javascript|vbscript|data|http|https)\s*:/i.test(trimmed)
    ) {
      return "/";
    }
  }

  try {
    const base = "https://economize.local";
    const parsed = new URL(stripped, base);
    if (parsed.origin !== base || parsed.hostname !== "economize.local") {
      return "/";
    }
    if (
      !parsed.pathname.startsWith("/") ||
      parsed.pathname.startsWith("//") ||
      parsed.pathname.includes("\\")
    ) {
      return "/";
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

function isPrivateOrBlockedHostname(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!clean) return true;

  // Bloqueia localhost, loopback IPv6, IPs não-roteáveis e domínios internos/metadados cloud
  if (
    clean === "localhost" ||
    clean === "0.0.0.0" ||
    clean === "::1" ||
    clean === "0:0:0:0:0:0:0:1" ||
    clean === "metadata.google.internal" ||
    clean === "metadata" ||
    clean.endsWith(".internal") ||
    clean.endsWith(".local") ||
    clean.endsWith(".localhost")
  ) {
    return true;
  }

  // IPv6 loopback / unique local / link-local (fc00::/7, fe80::/10, ::ffff:127.*)
  if (
    clean.startsWith("fc") ||
    clean.startsWith("fd") ||
    clean.startsWith("fe80:") ||
    clean.startsWith("::ffff:")
  ) {
    return true;
  }

  // Bloqueia notação IP numérica decimal/octal/hex disfarçada (ex: 2130706433 ou 0x7f000001)
  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(clean)) {
    return true;
  }

  // Verifica faixas IPv4 privadas, loopback e link-local (AWS/GCP/Azure Cloud Metadata 169.254.169.254)
  const ipv4Match = clean.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  );
  if (ipv4Match) {
    const octets = [
      Number(ipv4Match[1]),
      Number(ipv4Match[2]),
      Number(ipv4Match[3]),
      Number(ipv4Match[4]),
    ];
    if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
      return true;
    }
    const [a, b] = octets;
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Valida URLs externas (ex: proofUrl em relatos de preço ou NFC-e),
 * permitindo apenas https:// (ou http://localhost:3000 em dev se explícito),
 * bloqueando IPs privados/loopback (127.0.0.1, 169.254.169.254 SSRF, 10.*, 192.168.*)
 * e esquemas javascript:/data:.
 */
export function validateSafeHttpUrl(urlStr: unknown): string | null {
  if (typeof urlStr !== "string") {
    return null;
  }

  const trimmed = urlStr.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (!trimmed || trimmed.length > 2048) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.username || parsed.password) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Permite apenas https:// (ou http://localhost:3000 estritamente em dev quando não for porta de serviço interno)
  if (parsed.protocol === "http:") {
    const isDevLocalApp =
      process.env.NODE_ENV === "development" &&
      hostname === "localhost" &&
      (parsed.port === "3000" || parsed.port === "");
    if (!isDevLocalApp) {
      return null;
    }
    return parsed.toString();
  }

  if (parsed.protocol !== "https:") {
    return null;
  }

  if (isPrivateOrBlockedHostname(hostname)) {
    return null;
  }

  if (!hostname.includes(".")) {
    return null;
  }

  return parsed.toString();
}

/**
 * Valida código de barras padrão GS1 (GTIN-8, GTIN-12, GTIN-13, GTIN-14)
 * verificando comprimento e dígito verificador pelo algoritmo oficial Módulo-10.
 */
export function validateGtinEan(ean: string): GtinValidationResult {
  if (typeof ean !== "string") {
    return {
      valid: false,
      normalized: "",
      reason: "O código EAN/GTIN deve ser uma string numérica.",
    };
  }

  const digits = ean.replace(/\D/g, "");
  if (![8, 12, 13, 14].includes(digits.length)) {
    return {
      valid: false,
      normalized: digits,
      reason: "O código EAN/GTIN deve ter 8, 12, 13 ou 14 dígitos numéricos.",
    };
  }

  if (/^0+$/.test(digits)) {
    return {
      valid: false,
      normalized: digits,
      reason: "Código EAN inválido (composto apenas por zeros).",
    };
  }

  const body = digits.slice(0, -1);
  const checkDigit = Number(digits.slice(-1));
  let sum = 0;

  for (let i = 0; i < body.length; i++) {
    const num = Number(body[body.length - 1 - i]);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += num * weight;
  }

  const expectedCheck = (10 - (sum % 10)) % 10;
  if (checkDigit !== expectedCheck) {
    return {
      valid: false,
      normalized: digits,
      reason: `Dígito verificador GS1 Módulo-10 inválido (esperado ${expectedCheck}, recebido ${checkDigit}).`,
    };
  }

  return { valid: true, normalized: digits };
}

/**
 * Verifica os magic bytes binários reais de um arquivo enviado para garantir que
 * corresponde a PNG, JPEG, WEBP ou PDF, bloqueando HTML/SVG/XML/executáveis disfarçados.
 */
export function validateFileMagicBytes(
  buffer: Uint8Array | Buffer,
  allowedTypes: ReadonlyArray<"png" | "jpeg" | "webp" | "pdf"> = [
    "png",
    "jpeg",
    "webp",
    "pdf",
  ]
): MagicBytesValidationResult {
  if (!buffer || buffer.length < 4) {
    return {
      valid: false,
      detectedMime: null,
      reason: "Arquivo vazio ou truncado (assinatura binária ausente).",
    };
  }

  // Detecta payloads textuais maliciosos disfarçados de imagem (HTML, SVG, XML, Script)
  const headText = Buffer.from(buffer.subarray(0, 256))
    .toString("utf8")
    .trimStart()
    .toLowerCase();
  if (
    headText.startsWith("<!doctype") ||
    headText.startsWith("<html") ||
    headText.startsWith("<svg") ||
    headText.startsWith("<script") ||
    headText.startsWith("<?xml") ||
    headText.includes("<script") ||
    headText.includes("onload=") ||
    headText.includes("onerror=")
  ) {
    return {
      valid: false,
      detectedMime: "text/html",
      reason:
        "Upload bloqueado: arquivo HTML/SVG/Script disfarçado de imagem ou documento.",
    };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (isPng) {
    if (!allowedTypes.includes("png")) {
      return {
        valid: false,
        detectedMime: "image/png",
        reason: "Formato PNG não permitido para esta operação.",
      };
    }
    return { valid: true, detectedMime: "image/png" };
  }

  // JPEG: FF D8 FF
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  if (isJpeg) {
    if (!allowedTypes.includes("jpeg")) {
      return {
        valid: false,
        detectedMime: "image/jpeg",
        reason: "Formato JPEG não permitido para esta operação.",
      };
    }
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // WEBP: "RIFF" (52 49 46 46) nos bytes 0..3 e "WEBP" (57 45 42 50) nos bytes 8..11
  const isWebp =
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isWebp) {
    if (!allowedTypes.includes("webp")) {
      return {
        valid: false,
        detectedMime: "image/webp",
        reason: "Formato WEBP não permitido para esta operação.",
      };
    }
    return { valid: true, detectedMime: "image/webp" };
  }

  // PDF: "%PDF-" (25 50 44 46 2D)
  const isPdf =
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  if (isPdf) {
    if (!allowedTypes.includes("pdf")) {
      return {
        valid: false,
        detectedMime: "application/pdf",
        reason: "Formato PDF não permitido para esta operação.",
      };
    }
    return { valid: true, detectedMime: "application/pdf" };
  }

  return {
    valid: false,
    detectedMime: null,
    reason:
      "Assinatura binária (magic bytes) inválida. Envie apenas arquivos reais PNG, JPEG, WEBP ou PDF.",
  };
}

/**
 * Valida CNPJ brasileiro (14 dígitos) com cálculo oficial dos dois dígitos verificadores (Módulo 11).
 */
export function validateCnpj(rawCnpj: string): CnpjValidationResult {
  const digits = (rawCnpj || "").replace(/\D/g, "");
  if (digits.length !== 14) {
    return {
      valid: false,
      normalized: digits,
      formatted: rawCnpj,
      reason: "O CNPJ deve conter exatamente 14 dígitos numéricos.",
    };
  }

  if (/^(\d)\1{13}$/.test(digits)) {
    return {
      valid: false,
      normalized: digits,
      formatted: rawCnpj,
      reason: "CNPJ inválido (sequência repetida de dígitos).",
    };
  }

  const calcDigit = (base: string, weights: ReadonlyArray<number>): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += Number(base[i]) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calcDigit(digits.slice(0, 12), weights1);
  const d2 = calcDigit(digits.slice(0, 12) + String(d1), weights2);

  if (Number(digits[12]) !== d1 || Number(digits[13]) !== d2) {
    return {
      valid: false,
      normalized: digits,
      formatted: rawCnpj,
      reason: "Dígitos verificadores do CNPJ inválidos (Módulo 11).",
    };
  }

  const formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(
    5,
    8
  )}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;

  return {
    valid: true,
    normalized: digits,
    formatted,
  };
}
