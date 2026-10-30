"use client";

import { useCallback, useState } from "react";
import type { CepGeocodeResponse } from "@/app/api/cep/[cep]/route";

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/**
 * Fórmula de Haversine para calcular a distância aproximada em linha reta (km)
 * entre as coordenadas do usuário e as coordenadas reais do supermercado.
 * Retorna null se qualquer coordenada for nula ou inválida (nunca inventa distância).
 */
export function calculateHaversineKm(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined
): number | null {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lng1 === null ||
    lng1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lng2 === null ||
    lng2 === undefined ||
    Number.isNaN(lat1) ||
    Number.isNaN(lng1) ||
    Number.isNaN(lat2) ||
    Number.isNaN(lng2)
  ) {
    return null;
  }

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

export function useUserLocation() {
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const lookupCepReal = useCallback(
    async (rawCep: string): Promise<CepGeocodeResponse | null> => {
      const cleanCep = rawCep.replace(/\D/g, "");
      if (cleanCep.length !== 8) {
        setGeoError("Informe um CEP válido com 8 números.");
        return null;
      }

      setLoadingGeo(true);
      setGeoError(null);
      try {
        const res = await fetch(`/api/cep/${encodeURIComponent(cleanCep)}`);
        const data = (await res.json()) as CepGeocodeResponse & {
          error?: string;
        };

        if (!res.ok || data.error) {
          setGeoError(
            data.error || "Não foi possível localizar o CEP informado."
          );
          return null;
        }

        return data;
      } catch {
        setGeoError("Não foi possível consultar o CEP no momento.");
        return null;
      } finally {
        setLoadingGeo(false);
      }
    },
    []
  );

  const requestDeviceCoordinates =
    useCallback((): Promise<GeoCoordinates | null> => {
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
              "Permissão de localização não concedida. Informe seu CEP abaixo."
            );
            resolve(null);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }, []);

  return {
    loadingGeo,
    geoError,
    lookupCepReal,
    requestDeviceCoordinates,
    calculateHaversineKm,
  };
}
