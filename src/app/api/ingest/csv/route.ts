import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface ParsedCsvRow {
  ean: string;
  nome: string;
  preco: number;
  oferta: boolean;
  promo_label?: string;
}

export async function POST(request: NextRequest) {
  try {
    let rawCsv = "";
    let supermarketId = "mercado-a";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const mkt = formData.get("supermarket_id");
      if (typeof mkt === "string" && mkt.trim()) {
        supermarketId = mkt.trim();
      }
      if (file instanceof File) {
        rawCsv = await file.text();
      }
    } else {
      const body = (await request.json()) as {
        csvText?: string;
        supermarket_id?: string;
      };
      rawCsv = body.csvText || "";
      if (body.supermarket_id) supermarketId = body.supermarket_id;
    }

    const lines = rawCsv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsedRows: ParsedCsvRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Ignora linha de cabeçalho "ean,nome,preco,oferta"
      if (i === 0 && /ean/i.test(line) && /pre[cç]o/i.test(line)) {
        continue;
      }

      const separator = line.includes(";") ? ";" : ",";
      const parts = line.split(separator).map((p) => p.trim());
      if (parts.length < 3) continue;

      const [ean, nome, precoStr, ofertaStr] = parts;
      const preco = parseFloat((precoStr || "").replace(",", "."));
      if (!ean || !nome || isNaN(preco) || preco <= 0) continue;

      const isOferta =
        /^(true|1|sim|s|oferta|promo)$/i.test(ofertaStr || "") ||
        Boolean(ofertaStr && ofertaStr.length > 2 && ofertaStr !== "false");

      const promoLabel =
        ofertaStr && !/^(true|false|1|0|sim|nao|não)$/i.test(ofertaStr)
          ? ofertaStr
          : isOferta
            ? "Oferta CSV"
            : undefined;

      parsedRows.push({
        ean,
        nome,
        preco,
        oferta: isOferta,
        promo_label: promoLabel,
      });

      const prodId = `ean-${ean.replace(/\D/g, "") || Date.now()}`;

      await supabase
        .from("products")
        .upsert(
          {
            id: prodId,
            ean,
            name: nome,
            brand: "Catálogo Parceiro",
            category: "mercearia",
            size_label: "1 un",
            unit_type: "un",
            unit_value: 1,
            image_url: "/logo-oficial.jpg",
          },
          { onConflict: "ean" }
        )
        .then(() => {});

      await supabase
        .from("market_prices")
        .upsert(
          {
            supermarket_id: supermarketId,
            product_id: prodId,
            price: preco,
            is_promo: isOferta,
            promo_label: promoLabel || null,
            in_stock: true,
            source: "partner_csv",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "supermarket_id,product_id" }
        )
        .then(() => {});
    }

    return NextResponse.json({
      success: true,
      source: "partner_csv",
      supermarket_id: supermarketId,
      count: parsedRows.length,
      items: parsedRows,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Falha ao processar arquivo CSV.";
    return NextResponse.json(
      { success: false, error: message, count: 0, items: [] },
      { status: 500 }
    );
  }
}
