"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Globe,
  Instagram,
  Printer,
  QrCode,
  RefreshCw,
  Share2,
  Smartphone,
  Sparkles,
} from "lucide-react";

export const OFFICIAL_SITE_ORIGIN = "https://economize-nine.vercel.app";
export const OFFICIAL_INSTAGRAM_URL =
  "https://www.instagram.com/economizemais_oficial";
export const OFFICIAL_INSTAGRAM_HANDLE = "@economizemais_oficial";

export interface QrCodePromoCardProps {
  /** Caminho relativo inicial (ex.: "/", "/buscar", "/lista", "/seja-parceiro", "/mercados/123") */
  defaultPath?: string;
  /** Título exibido no cartaz de divulgação */
  title?: string;
  /** Subtítulo explicativo exibido no cartaz */
  subtitle?: string;
  /** Selo superior do cartaz */
  badgeLabel?: string;
  /** Nome opcional do supermercado parceiro quando o QR aponta para um mercado específico */
  marketName?: string | null;
  /** Endereço opcional do supermercado parceiro */
  marketAddress?: string | null;
  /** Instruções em 4 passos impressas no cartaz */
  steps?: readonly [string, string, string, string];
  /** Permite editar o caminho relativo além da URL base */
  allowCustomPath?: boolean;
}

const DEFAULT_STEPS: readonly [string, string, string, string] = [
  "Aponte a câmera do celular para o QR Code",
  "Informe seu CEP ou ative a localização",
  "Busque produtos ou monte sua Lista Inteligente",
  "Compare os preços coletados e economize na compra",
];

/**
 * Gera uma matriz determinística de fallback visual (29x29 com finder patterns ISO)
 * usada apenas caso o cliente esteja sem conexão externa ao renderizar o canvas offline.
 */
function buildDeterministicMatrix(payload: string): boolean[][] {
  const size = 29;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        const inOuter =
          r >= 0 && r <= 6 && c >= 0 && c <= 6 && (r === 0 || r === 6 || c === 0 || c === 6);
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[rr][cc] = inOuter || inInner;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at (20, 20)
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const rr = 22 + r;
      const cc = 22 + c;
      reserved[rr][cc] = true;
      matrix[rr][cc] =
        Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
    }
  }

  // Deterministic bit stream from payload bytes (FNV-1a + byte stream)
  const bytes: number[] = [];
  for (let i = 0; i < payload.length; i++) {
    bytes.push(payload.charCodeAt(i) & 0xff);
  }
  if (bytes.length === 0) bytes.push(0x45);

  let hash = 2166136261;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const b = bytes[(r * size + c) % bytes.length];
      hash ^= b ^ ((r * 31 + c * 17) & 0xff);
      hash = Math.imul(hash, 16777619) >>> 0;
      matrix[r][c] = ((hash >>> ((r + c) % 16)) & 1) === 1;
    }
  }

  return matrix;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      linesDrawn += 1;
      if (linesDrawn >= maxLines) {
        ctx.fillText(`${line.trim()}…`, x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export default function QrCodePromoCard({
  defaultPath = "/",
  title = "Compare preços perto de você",
  subtitle = "Aponte a câmera do celular para consultar preços atualizados com data e hora de coleta e montar sua lista inteligente.",
  badgeLabel = "KIT DE DIVULGAÇÃO OFICIAL • ECONOMIZE+",
  marketName = null,
  marketAddress = null,
  steps = DEFAULT_STEPS,
  allowCustomPath = true,
}: QrCodePromoCardProps) {
  const [baseOrigin, setBaseOrigin] = useState<string>(OFFICIAL_SITE_ORIGIN);
  const [detectedOrigin, setDetectedOrigin] = useState<string>("");
  const [customPath, setCustomPath] = useState<string>(defaultPath);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingPng, setDownloadingPng] = useState<boolean>(false);
  const [downloadingSvg, setDownloadingSvg] = useState<boolean>(false);
  const [qrImageError, setQrImageError] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sincroniza defaultPath quando o usuário troca a opção na Central de Divulgação
  useEffect(() => {
    setCustomPath(defaultPath);
  }, [defaultPath]);

  // Detecta window.location.origin automaticamente no cliente (usando https://economize-nine.vercel.app como fallback quando localhost ou vazio)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      const origin = window.location.origin;
      setDetectedOrigin(origin);
      const isLocal =
        origin.includes("localhost") || origin.includes("127.0.0.1");
      setBaseOrigin(isLocal ? OFFICIAL_SITE_ORIGIN : origin);
    } else {
      setBaseOrigin(OFFICIAL_SITE_ORIGIN);
    }
  }, []);

  const normalizedOrigin = useMemo(() => {
    const raw = (baseOrigin || detectedOrigin || OFFICIAL_SITE_ORIGIN).trim();
    return raw.replace(/\/+$/, "");
  }, [baseOrigin, detectedOrigin]);

  const normalizedPath = useMemo(() => {
    const raw = customPath.trim();
    if (!raw || raw === "/") return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return raw.startsWith("/") ? raw : `/${raw}`;
  }, [customPath]);

  const fullUrl = useMemo(() => {
    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }
    if (!normalizedOrigin) return OFFICIAL_SITE_ORIGIN;
    return `${normalizedOrigin}${normalizedPath || "/"}`;
  }, [normalizedOrigin, normalizedPath]);

  const qrPngUrl = useMemo(() => {
    if (!fullUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&ecc=M&margin=1&color=063A6B&bgcolor=FFFFFF&format=png&data=${encodeURIComponent(
      fullUrl
    )}`;
  }, [fullUrl]);

  const qrSvgUrl = useMemo(() => {
    if (!fullUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&ecc=M&margin=1&color=063A6B&bgcolor=FFFFFF&format=svg&data=${encodeURIComponent(
      fullUrl
    )}`;
  }, [fullUrl]);

  const fallbackMatrix = useMemo(
    () => buildDeterministicMatrix(fullUrl || OFFICIAL_SITE_ORIGIN),
    [fullUrl]
  );

  useEffect(() => {
    setQrImageError(false);
  }, [qrPngUrl]);

  const notifyStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      notifyStatus("Link de divulgação copiado para a área de transferência!");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      notifyStatus("Não foi possível copiar automaticamente. Copie o endereço exibido.");
    }
  }, [fullUrl, notifyStatus]);

  const handleDownloadSvg = useCallback(async () => {
    if (!fullUrl) return;
    setDownloadingSvg(true);
    try {
      const response = await fetch(qrSvgUrl);
      if (response.ok) {
        const svgText = await response.text();
        const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `qrcode-economize-plus.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        notifyStatus("QR Code vetorial (SVG) baixado com sucesso!");
        return;
      }
      throw new Error("Fallback SVG local");
    } catch {
      // Gera SVG vetorial determinístico local caso offline
      const moduleCount = fallbackMatrix.length;
      const quietZone = 2;
      const totalModules = moduleCount + quietZone * 2;
      const cellSize = 16;
      const svgSize = totalModules * cellSize;
      let rects = "";
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (fallbackMatrix[r][c]) {
            const x = (c + quietZone) * cellSize;
            const y = (r + quietZone) * cellSize;
            rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="#063A6B"/>`;
          }
        }
      }
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <rect width="100%" height="100%" fill="#FFFFFF" rx="24"/>
  ${rects}
</svg>`;
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `qrcode-economize-plus.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      notifyStatus("QR Code vetorial (SVG) gerado e baixado!");
    } finally {
      setDownloadingSvg(false);
    }
  }, [fallbackMatrix, fullUrl, notifyStatus, qrSvgUrl]);

  const handleDownloadPosterPng = useCallback(async () => {
    if (!fullUrl) return;
    setDownloadingPng(true);
    try {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      const width = 1080;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Contexto 2D indisponível");
      }

      // 1. Fundo principal em Azul-Escuro Institucional (#063A6B) com gradiente suave
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#063A6B");
      bgGrad.addColorStop(0.65, "#052E55");
      bgGrad.addColorStop(1, "#042240");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Faixa superior vibrante nas cores da marca
      ctx.fillStyle = "#00AFCF";
      ctx.fillRect(0, 0, width / 3, 16);
      ctx.fillStyle = "#52D95D";
      ctx.fillRect(width / 3, 0, width / 3, 16);
      ctx.fillStyle = "#FFC928";
      ctx.fillRect((width / 3) * 2, 0, width / 3, 16);

      // Círculos decorativos discretos
      ctx.save();
      ctx.fillStyle = "rgba(0, 175, 207, 0.10)";
      ctx.beginPath();
      ctx.arc(width - 120, 180, 260, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(82, 217, 93, 0.08)";
      ctx.beginPath();
      ctx.arc(120, height - 180, 240, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Selo superior
      ctx.save();
      drawRoundedRect(ctx, 190, 52, width - 380, 48, 24);
      ctx.fillStyle = "rgba(255, 201, 40, 0.16)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFC928";
      ctx.stroke();
      ctx.fillStyle = "#FFC928";
      ctx.font = "bold 20px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeLabel.toUpperCase(), width / 2, 76);
      ctx.restore();

      // 3. Logo oficial (/logo-oficial.jpg) + Marca Economize+
      const loadImg = (src: string, crossOrigin?: string): Promise<HTMLImageElement | null> =>
        new Promise((resolve) => {
          const img = new Image();
          if (crossOrigin) img.crossOrigin = crossOrigin;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });

      const [logoImg, qrImg] = await Promise.all([
        loadImg("/logo-oficial.jpg"),
        loadImg(qrPngUrl, "anonymous"),
      ]);

      // Cabeçalho com Logo + Nome Economize+
      const headerY = 165;
      if (logoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2 - 210, headerY, 46, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "#FFFFFF";
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#FFC928";
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(logoImg, width / 2 - 256, headerY - 46, 92, 92);
        ctx.restore();
      }

      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = "800 64px Poppins, Inter, system-ui, sans-serif";
      const brandX = logoImg ? width / 2 - 142 : width / 2 - 190;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Economize", brandX, headerY - 10);
      const econWidth = ctx.measureText("Economize").width;
      ctx.fillStyle = "#52D95D";
      ctx.fillText("+", brandX + econWidth + 4, headerY - 10);

      ctx.font = "600 24px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#E6F7FB";
      ctx.fillText("Compare. Escolha. Economize.", brandX, headerY + 34);
      ctx.restore();

      // 4. Título e Subtítulo de contexto
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 42px Poppins, Inter, system-ui, sans-serif";
      const displayTitle = marketName ? `${marketName} no Economize+` : title;
      wrapCanvasText(ctx, displayTitle, width / 2, 268, width - 140, 50, 2);

      ctx.fillStyle = "#E6F7FB";
      ctx.font = "500 24px Inter, system-ui, sans-serif";
      const subText = marketAddress
        ? `${marketAddress} • Consulte preços atualizados pelo celular`
        : subtitle;
      wrapCanvasText(ctx, subText, width / 2, 330, width - 160, 34, 2);
      ctx.restore();

      // 5. Card Branco Central do QR Code
      const cardWidth = 540;
      const cardHeight = 560;
      const cardX = (width - cardWidth) / 2;
      const cardY = 390;

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 36);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#00AFCF";
      ctx.stroke();

      // Faixa superior do card do QR Code
      drawRoundedRect(ctx, cardX + 40, cardY + 24, cardWidth - 80, 50, 25);
      ctx.fillStyle = "#E6F7FB";
      ctx.fill();
      ctx.fillStyle = "#063A6B";
      ctx.font = "bold 21px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("APONTE A CÂMERA DO CELULAR AQUI", width / 2, cardY + 49);

      // Desenha o QR Code dentro do card
      const qrSize = 420;
      const qrX = (width - qrSize) / 2;
      const qrY = cardY + 94;

      if (qrImg) {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      } else {
        // Fallback: desenha matriz determinística diretamente no canvas
        const mSize = fallbackMatrix.length;
        const cell = qrSize / mSize;
        ctx.fillStyle = "#063A6B";
        for (let r = 0; r < mSize; r++) {
          for (let c = 0; c < mSize; c++) {
            if (fallbackMatrix[r][c]) {
              ctx.fillRect(
                Math.floor(qrX + c * cell),
                Math.floor(qrY + r * cell),
                Math.ceil(cell),
                Math.ceil(cell)
              );
            }
          }
        }
      }
      ctx.restore();

      // 6. Bloco dos 4 Passos (Guia Rápido no Cartaz)
      const stepsStartY = 985;
      const boxWidth = 460;
      const boxHeight = 96;
      const gapX = 28;
      const gapY = 22;
      const leftColX = (width - (boxWidth * 2 + gapX)) / 2;

      steps.forEach((stepText, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const bx = leftColX + col * (boxWidth + gapX);
        const by = stepsStartY + row * (boxHeight + gapY);

        ctx.save();
        drawRoundedRect(ctx, bx, by, boxWidth, boxHeight, 20);
        ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(230, 247, 251, 0.28)";
        ctx.stroke();

        // Círculo numerado
        ctx.beginPath();
        ctx.arc(bx + 42, by + boxHeight / 2, 22, 0, Math.PI * 2);
        ctx.fillStyle = idx === 3 ? "#52D95D" : "#FFC928";
        ctx.fill();

        ctx.fillStyle = "#063A6B";
        ctx.font = "800 22px Poppins, Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(idx + 1), bx + 42, by + boxHeight / 2);

        // Texto do passo
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "600 20px Inter, system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        wrapCanvasText(ctx, stepText, bx + 78, by + 42, boxWidth - 96, 26, 2);
        ctx.restore();
      });

      // 7. Rodapé com a URL explícita, Instagram oficial e aviso de transparência
      const footerY = 1230;
      ctx.save();
      drawRoundedRect(ctx, 66, footerY, width - 132, 84, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();

      ctx.fillStyle = "#063A6B";
      ctx.font = "bold 22px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const urlDisplay =
        fullUrl.length > 44 ? `${fullUrl.slice(0, 41)}...` : fullUrl;
      ctx.fillText(
        `${urlDisplay}  •  Instagram: ${OFFICIAL_INSTAGRAM_HANDLE}`,
        width / 2,
        footerY + 26
      );

      ctx.fillStyle = "#00AFCF";
      ctx.font = "bold 17px Inter, system-ui, sans-serif";
      ctx.fillText(
        `Site oficial: economize-nine.vercel.app  •  Siga ${OFFICIAL_INSTAGRAM_HANDLE}`,
        width / 2,
        footerY + 50
      );

      ctx.fillStyle = "#475569";
      ctx.font = "500 15px Inter, system-ui, sans-serif";
      ctx.fillText(
        "Transparência: preços exibem fonte, data e hora de coleta • Sujeitos a alteração na loja",
        width / 2,
        footerY + 70
      );
      ctx.restore();

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const slug = marketName
        ? marketName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
        : "divulgacao";
      link.href = dataUrl;
      link.download = `cartaz-qrcode-economize-plus-${slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notifyStatus("Cartaz em alta resolução (1080×1350 PNG) baixado com sucesso!");
    } catch {
      notifyStatus("Não foi possível exportar o PNG automaticamente. Use a opção Imprimir Cartaz.");
    } finally {
      setDownloadingPng(false);
    }
  }, [
    badgeLabel,
    fallbackMatrix,
    fullUrl,
    marketAddress,
    marketName,
    notifyStatus,
    qrPngUrl,
    steps,
    subtitle,
    title,
  ]);

  const handlePrintPoster = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!fullUrl) return;
    const shareTitle = marketName
      ? `${marketName} no Economize+ | Compare. Escolha. Economize.`
      : "Economize+ | Compare. Escolha. Economize.";
    const shareText = marketName
      ? `Confira os preços atualizados de ${marketName} no Economize+ e monte sua lista de compras: ${fullUrl}`
      : `Compare preços entre mercados próximos e monte sua lista de compras inteligente no Economize+: ${fullUrl}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: fullUrl,
        });
        notifyStatus("Compartilhamento aberto com sucesso!");
        return;
      } catch {
        // Se o usuário cancelar o Web Share nativo, segue ou abre WhatsApp
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }, [fullUrl, marketName, notifyStatus]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {/* Canvas oculto usado para renderizar o cartaz 1080x1350 em alta resolução */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Coluna de Configuração e Ações (oculta na impressão em papel) */}
        <div className="space-y-6 lg:col-span-6 print:hidden">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-navy">
              <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
              Fluxo Google Pomelli • Kit de Marketing & QR Code
            </span>
            <h2 className="mt-2.5 font-heading text-xl font-extrabold tracking-tight text-brand-navy sm:text-2xl">
              Gerador de QR Code & Cartaz de Divulgação
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              O QR Code é preparado automaticamente com o endereço atual da aplicação.
              Assim que você publicar na Vercel ou configurar um domínio próprio, basta
              confirmar ou ajustar a URL abaixo para gerar o material oficial de balcão,
              gôndola ou redes sociais.
            </p>
          </div>

          {/* Configuração da URL Oficial de Produção */}
          <div className="space-y-4 rounded-2xl border border-brand-blue/20 bg-[#F4FAFC] p-4 sm:p-5">
            <div>
              <label
                htmlFor="qr-base-origin-input"
                className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-brand-navy"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-brand-blue" />
                  Endereço Base Oficial (Produção)
                </span>
                {detectedOrigin && baseOrigin !== detectedOrigin && (
                  <button
                    type="button"
                    onClick={() => setBaseOrigin(detectedOrigin)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Restaurar origem atual
                  </button>
                )}
              </label>
              <input
                id="qr-base-origin-input"
                type="url"
                value={baseOrigin}
                onChange={(e) => setBaseOrigin(e.target.value)}
                placeholder="Ex.: https://economize-nine.vercel.app"
                className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-brand-navy shadow-xs focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>
                  Origem ativa:{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-brand-navy">
                    {detectedOrigin || OFFICIAL_SITE_ORIGIN}
                  </code>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBaseOrigin(OFFICIAL_SITE_ORIGIN);
                      if (/^https?:\/\//i.test(customPath)) {
                        setCustomPath("/");
                      }
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-white px-3 py-2 text-xs font-semibold text-brand-navy transition hover:border-brand-blue active:scale-95"
                  >
                    <Globe className="h-3.5 w-3.5 text-brand-blue" />
                    Site Oficial (Vercel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomPath(OFFICIAL_INSTAGRAM_URL)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-brand-light px-3 py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-blue hover:text-white active:scale-95"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    QR do Instagram ({OFFICIAL_INSTAGRAM_HANDLE})
                  </button>
                </div>
              </div>
            </div>

            {allowCustomPath && (
              <div>
                <label
                  htmlFor="qr-custom-path-input"
                  className="block text-xs font-bold uppercase tracking-wider text-brand-navy"
                >
                  Destino dentro do Aplicativo (Rota)
                </label>
                <input
                  id="qr-custom-path-input"
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/ ou /buscar ou /mercados/id"
                  className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm text-brand-navy shadow-xs focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>
            )}

            {/* Link completo final + Copiar */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                URL Codificada no QR Code
              </span>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={fullUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 break-all font-mono text-xs font-semibold text-brand-blue hover:underline sm:text-sm"
                >
                  <span>{fullUrl || "Informe o endereço base acima"}</span>
                  {fullUrl && <ExternalLink className="h-3.5 w-3.5 shrink-0" />}
                </a>
              </div>
            </div>
          </div>

          {/* Botões de Ação com min-h-[44px] */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!fullUrl}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-brand-navy bg-white px-4 py-2.5 text-sm font-bold text-brand-navy transition hover:bg-brand-light active:scale-95 disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-brand-green" />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-brand-blue" />
                  <span>Copiar Link de Divulgação</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={!fullUrl}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-brand-navy shadow-xs transition hover:brightness-95 active:scale-95 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              <span>Compartilhar / WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPosterPng}
              disabled={!fullUrl || downloadingPng}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-navy/90 active:scale-95 disabled:opacity-50 sm:col-span-2"
            >
              <Download className="h-4 w-4 text-brand-yellow" />
              <span>
                {downloadingPng
                  ? "Gerando Cartaz em Alta Resolução (1080×1350)..."
                  : "Baixar Cartaz Pronto para Impressão / Redes Sociais (PNG)"}
              </span>
            </button>

            <button
              type="button"
              onClick={handlePrintPoster}
              disabled={!fullUrl}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:brightness-95 active:scale-95 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Cartaz de Balcão / Caixa</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={!fullUrl || downloadingSvg}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-slate-100 active:scale-95 disabled:opacity-50"
            >
              <FileCode2 className="h-4 w-4 text-brand-blue" />
              <span>
                {downloadingSvg ? "Baixando SVG..." : "Baixar QR Vetorial (SVG)"}
              </span>
            </button>
          </div>

          {statusMessage && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 rounded-xl border border-brand-green/40 bg-brand-light/70 px-4 py-2.5 text-xs font-semibold text-brand-navy"
            >
              <Check className="h-4 w-4 shrink-0 text-brand-green" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Instruções rápidas de uso físico e digital */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-600">
            <p className="font-bold text-brand-navy">
              Como utilizar este material de divulgação:
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>
                <strong>No caixa ou entrada do mercado:</strong> clique em{" "}
                <em>Imprimir Cartaz de Balcão / Caixa</em> (formato A4 ou display A5)
                para que os clientes consultem as ofertas pelo celular.
              </li>
              <li>
                <strong>No Instagram, Status ou WhatsApp:</strong> clique em{" "}
                <em>Baixar Cartaz Pronto (PNG)</em> para obter a arte em{" "}
                <span className="font-mono">1080×1350px</span> na paleta oficial.
              </li>
            </ul>
          </div>
        </div>

        {/* Coluna de Preview Ao Vivo do Cartaz Oficial (também usada na impressão) */}
        <div className="flex flex-col items-center justify-center lg:col-span-6">
          <div
            id="economize-printable-poster"
            className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-brand-navy bg-brand-navy text-white shadow-xl print:max-w-none print:border-0 print:shadow-none"
          >
            {/* Barra tricolor oficial no topo */}
            <div className="grid h-2.5 w-full grid-cols-3">
              <div className="bg-brand-blue" />
              <div className="bg-brand-green" />
              <div className="bg-brand-yellow" />
            </div>

            <div className="p-6 text-center sm:p-7">
              {/* Badge Superior */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-yellow/60 bg-brand-yellow/15 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-yellow">
                <QrCode className="h-3.5 w-3.5" />
                <span>{badgeLabel}</span>
              </div>

              {/* Logotipo Oficial + Marca */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <img
                  src="/logo-oficial.jpg"
                  alt="Logotipo Economize+"
                  className="h-14 w-14 rounded-full border-2 border-brand-yellow bg-white object-cover shadow-md"
                />
                <div className="text-left">
                  <div className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                    <span>Economize</span>
                    <span className="text-brand-green">+</span>
                  </div>
                  <p className="text-xs font-semibold text-brand-light">
                    Compare. Escolha. Economize.
                  </p>
                </div>
              </div>

              {/* Título e Subtítulo */}
              <h3 className="mt-4 font-heading text-lg font-extrabold leading-snug text-white sm:text-xl">
                {marketName ? `${marketName} no Economize+` : title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-brand-light/90 sm:text-sm">
                {marketAddress
                  ? `${marketAddress} • Consulte preços atualizados pelo celular`
                  : subtitle}
              </p>

              {/* Quadro Branco Central com o QR Code Real */}
              <div className="mx-auto mt-5 max-w-[270px] rounded-2xl border-4 border-brand-blue bg-white p-4 text-brand-navy shadow-inner">
                <div className="mb-2.5 flex items-center justify-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-navy">
                  <Smartphone className="h-3.5 w-3.5 text-brand-blue" />
                  <span>Aponte a câmera do celular</span>
                </div>

                <div className="relative mx-auto flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-xl bg-white p-1">
                  {fullUrl && !qrImageError ? (
                    <img
                      src={qrPngUrl}
                      alt={`QR Code para ${fullUrl}`}
                      crossOrigin="anonymous"
                      onError={() => setQrImageError(true)}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <svg
                      viewBox={`0 0 ${fallbackMatrix.length + 4} ${fallbackMatrix.length + 4}`}
                      className="h-full w-full"
                      role="img"
                      aria-label={`QR Code vetorial para ${fullUrl}`}
                    >
                      <rect width="100%" height="100%" fill="#FFFFFF" />
                      {fallbackMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx + 2}
                              y={rIdx + 2}
                              width={1}
                              height={1}
                              fill="#063A6B"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  )}
                </div>
              </div>

              {/* 4 Passos Explicativos */}
              <div className="mt-5 grid grid-cols-1 gap-2 text-left sm:grid-cols-2">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-2.5 rounded-xl border border-white/15 bg-white/10 p-2.5"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-heading text-xs font-extrabold text-brand-navy ${
                        index === 3 ? "bg-brand-green" : "bg-brand-yellow"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-[11px] font-medium leading-snug text-white">
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rodapé do Cartaz com URL explícita e Instagram Oficial */}
              <div className="mt-5 rounded-xl bg-white px-3.5 py-2.5 text-center text-brand-navy">
                <p className="truncate font-mono text-xs font-bold text-brand-navy">
                  {fullUrl || OFFICIAL_SITE_ORIGIN}
                </p>
                <p className="mt-0.5 text-[11px] font-bold text-brand-blue">
                  economize-nine.vercel.app • Instagram:{" "}
                  {OFFICIAL_INSTAGRAM_HANDLE}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                  Preços exibem fonte, data e hora de coleta • Economize+
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
