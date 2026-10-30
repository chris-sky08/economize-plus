"use client";

import { useCallback, useState } from "react";

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface ViaCepResult {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

/**
 * Fórmula de Haversine para calcular a distância real em quilômetros
 * entre as coordenadas do usuário (lat1, lng1) e cada supermercado (lat2, lng2).
 */
export function calculateHaversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio médio da Terra em km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.max(0.1, Math.round(distance * 10) / 10);
}

const NEIGHBORHOOD_COORDS: Record<string, GeoCoordinates> = {
  "vila mariana": { lat: -23.5842, lng: -46.6365 },
  "saúde": { lat: -23.6135, lng: -46.6382 },
  "saude": { lat: -23.6135, lng: -46.6382 },
  "ipiranga": { lat: -23.5869, lng: -46.6052 },
  "moema": { lat: -23.5976, lng: -46.6625 },
  "vila clementino": { lat: -23.5964, lng: -46.6458 },
  "liberdade": { lat: -23.5587, lng: -46.6347 },
  "centro": { lat: -23.5505, lng: -46.6333 },
};

export function inferCoordinatesForRegion(
  neighborhood: string,
  zipCode: string
): GeoCoordinates {
  const key = neighborhood.trim().toLowerCase();
  for (const [k, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
    if (key.includes(k)) {
      return coords;
    }
  }
  const cleanZip = zipCode.replace(/\D/g, "");
  if (cleanZip.startsWith("0404")) return NEIGHBORHOOD_COORDS["saúde"];
  if (cleanZip.startsWith("042")) return NEIGHBORHOOD_COORDS["ipiranga"];
  if (cleanZip.startsWith("0407")) return NEIGHBORHOOD_COORDS["moema"];
  if (cleanZip.startsWith("010")) return NEIGHBORHOOD_COORDS["centro"];
  return NEIGHBORHOOD_COORDS["vila mariana"];
}

export function useUserLocation() {
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const lookupCepViaCep = useCallback(async (rawCep: string) => {
    const cleanCep = rawCep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return null;
    }
    setLoadingGeo(true);
    setGeoError(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!res.ok) return null;
      const data = (await res.json()) as ViaCepResult;
      if (data.erro) {
        setGeoError("CEP não encontrado na base oficial do ViaCEP.");
        return null;
      }
      const neighborhood = data.bairro || "Centro";
      const city = data.localidade || "São Paulo";
      const coords = inferCoordinatesForRegion(neighborhood, cleanCep);
      return {
        neighborhood,
        city,
        state: data.uf || "SP",
        zipCode: data.cep || rawCep,
        lat: coords.lat,
        lng: coords.lng,
      };
    } catch {
      setGeoError("Não foi possível consultar o ViaCEP no momento.");
      return null;
    } finally {
      setLoadingGeo(false);
    }
  }, []);

  const requestDeviceCoordinates = useCallback((): Promise<GeoCoordinates | null> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        setGeoError("Geolocalização não suportada neste navegador.");
        resolve(null);
        return;
      }
      setLoadingGeo(true);
      setGeoError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoadingGeo(false);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          setLoadingGeo(false);
          setGeoError(
            "Permissão de localização negada ou indisponível. Utilize o CEP abaixo."
          );
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    });
  }, []);

  return {
    loadingGeo,
    geoError,
    lookupCepViaCep,
    requestDeviceCoordinates,
    calculateHaversineKm,
  };
}
