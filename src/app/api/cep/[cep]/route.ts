import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rateLimit";

interface ViaCepApiResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

interface BrasilApiCepV2Response {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  location?: {
    type?: string;
    coordinates?: {
      longitude?: string | number;
      latitude?: string | number;
    };
  };
}

interface NominatimItem {
  lat?: string;
  lon?: string;
}

export interface CepGeocodeResponse {
  zipCode: string;
  street: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  geocodeSource: "brasilapi_v2" | "nominatim" | null;
}

const cepCache = new Map<
  string,
  { data: CepGeocodeResponse; expiresAt: number }
>();
let lastNominatimCallAt = 0;

async function waitNominatimThrottle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastNominatimCallAt;
  if (elapsed < 1050) {
    await new Promise((resolve) => setTimeout(resolve, 1050 - elapsed));
  }
  lastNominatimCallAt = Date.now();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cep: string }> }
) {
  const rate = checkRateLimit(request, "cep_lookup", 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Muitas buscas de CEP seguidas. Aguarde ${rate.retryAfterSeconds}s.`,
      },
      { status: 429 }
    );
  }

  const { cep } = await context.params;
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return NextResponse.json(
      { error: "Informe um CEP válido com 8 dígitos numéricos." },
      { status: 400 }
    );
  }

  const cached = cepCache.get(cleanCep);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    // 1) Consulta ViaCEP para endereço oficial
    const viaCepRes = await fetch(
      `https://viacep.com.br/ws/${cleanCep}/json/`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!viaCepRes.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o serviço ViaCEP no momento." },
        { status: 502 }
      );
    }

    const viaCepData = (await viaCepRes.json()) as ViaCepApiResponse;
    if (viaCepData.erro || !viaCepData.localidade || !viaCepData.uf) {
      return NextResponse.json(
        { error: "CEP não encontrado na base oficial dos Correios (ViaCEP)." },
        { status: 404 }
      );
    }

    let lat: number | null = null;
    let lng: number | null = null;
    let geocodeSource: CepGeocodeResponse["geocodeSource"] = null;

    // 2) Tenta obter coordenadas reais na BrasilAPI CEP v2
    try {
      const brRes = await fetch(
        `https://brasilapi.com.br/api/cep/v2/${cleanCep}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      if (brRes.ok) {
        const brData = (await brRes.json()) as BrasilApiCepV2Response;
        const rawLat = brData.location?.coordinates?.latitude;
        const rawLng = brData.location?.coordinates?.longitude;
        if (rawLat !== undefined && rawLng !== undefined) {
          const parsedLat = Number(rawLat);
          const parsedLng = Number(rawLng);
          if (
            !Number.isNaN(parsedLat) &&
            !Number.isNaN(parsedLng) &&
            parsedLat !== 0 &&
            parsedLng !== 0
          ) {
            lat = parsedLat;
            lng = parsedLng;
            geocodeSource = "brasilapi_v2";
          }
        }
      }
    } catch {
      // Prossegue para Nominatim caso BrasilAPI falhe
    }

    // 3) Caso BrasilAPI não traga coordenadas, consulta Nominatim com User-Agent e limite 1 req/s
    if (lat === null || lng === null) {
      try {
        await waitNominatimThrottle();
        const userAgent =
          (process.env.OFF_USER_AGENT || "").trim() ||
          "EconomizePlus/1.0 (https://github.com/chris-sky08/economize-plus; skyleywinfoster@gmail.com)";

        const queryParts = [
          viaCepData.logradouro,
          viaCepData.bairro,
          viaCepData.localidade,
          viaCepData.uf,
          "Brasil",
        ]
          .filter(Boolean)
          .join(", ");

        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(
            queryParts
          )}`,
          {
            headers: {
              "User-Agent": userAgent,
              Accept: "application/json",
            },
          }
        );

        if (nomRes.ok) {
          const nomData = (await nomRes.json()) as NominatimItem[];
          if (Array.isArray(nomData) && nomData.length > 0) {
            const parsedLat = Number(nomData[0].lat);
            const parsedLng = Number(nomData[0].lon);
            if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
              lat = parsedLat;
              lng = parsedLng;
              geocodeSource = "nominatim";
            }
          }
        }
      } catch {
        // Sem coordenada disponível: mantém lat = null e lng = null honestamente
      }
    }

    const result: CepGeocodeResponse = {
      zipCode: viaCepData.cep || `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`,
      street: viaCepData.logradouro ? viaCepData.logradouro : null,
      neighborhood: viaCepData.bairro ? viaCepData.bairro : null,
      city: viaCepData.localidade,
      state: viaCepData.uf,
      lat,
      lng,
      geocodeSource,
    };

    cepCache.set(cleanCep, {
      data: result,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao consultar CEP.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
