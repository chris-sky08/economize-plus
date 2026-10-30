"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Search, ShieldCheck, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  inferCoordinatesForRegion,
  useUserLocation,
} from "@/hooks/useUserLocation";

const QUICK_REGIONS = [
  {
    neighborhood: "Vila Mariana",
    city: "São Paulo",
    zipCode: "04101-000",
    lat: -23.5842,
    lng: -46.6365,
  },
  {
    neighborhood: "Saúde",
    city: "São Paulo",
    zipCode: "04045-000",
    lat: -23.6135,
    lng: -46.6382,
  },
  {
    neighborhood: "Ipiranga",
    city: "São Paulo",
    zipCode: "04208-000",
    lat: -23.5869,
    lng: -46.6052,
  },
  {
    neighborhood: "Moema",
    city: "São Paulo",
    zipCode: "04077-000",
    lat: -23.5976,
    lng: -46.6625,
  },
];

export default function LocationModal() {
  const {
    location,
    updateLocation,
    isLocationModalOpen,
    setIsLocationModalOpen,
    showToast,
  } = useApp();

  const {
    loadingGeo,
    geoError,
    lookupCepViaCep,
    requestDeviceCoordinates,
  } = useUserLocation();

  const [neighborhood, setNeighborhood] = useState(location.neighborhood);
  const [city, setCity] = useState(location.city);
  const [zipCode, setZipCode] = useState(location.zipCode);
  const [coords, setCoords] = useState({
    lat: location.lat,
    lng: location.lng,
  });
  const [maxRadiusKm, setMaxRadiusKm] = useState(location.maxRadiusKm);
  const [askingGeoConsent, setAskingGeoConsent] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleViaCepLookup = async () => {
    const res = await lookupCepViaCep(zipCode);
    if (res) {
      setNeighborhood(res.neighborhood);
      setCity(res.city);
      setZipCode(res.zipCode);
      setCoords({ lat: res.lat, lng: res.lng });
      showToast(`CEP localizado: ${res.neighborhood} - ${res.city}/${res.state}`);
    }
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCoords = inferCoordinatesForRegion(neighborhood, zipCode);
    updateLocation({
      neighborhood: neighborhood.trim() || "Vila Mariana",
      city: city.trim() || "São Paulo",
      zipCode: zipCode.trim() || "04101-000",
      lat: coords.lat || resolvedCoords.lat,
      lng: coords.lng || resolvedCoords.lng,
      maxRadiusKm,
    });
    setIsLocationModalOpen(false);
  };

  const handleConfirmGeolocation = async () => {
    const deviceCoords = await requestDeviceCoordinates();
    if (deviceCoords) {
      setAskingGeoConsent(false);
      updateLocation({
        neighborhood: "Sua Localização Atual (GPS)",
        city: "São Paulo",
        lat: deviceCoords.lat,
        lng: deviceCoords.lng,
        deviceLocationGranted: true,
      });
      setIsLocationModalOpen(false);
    } else {
      setAskingGeoConsent(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-localizacao-titulo"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-blue">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-localizacao-titulo"
                className="font-heading text-lg font-bold text-brand-navy"
              >
                Onde você quer economizar?
              </h2>
              <p className="text-xs text-slate-500">
                Calculamos a distância real (Haversine) até cada supermercado.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="min-h-[44px] min-w-[44px] rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar janela de localização"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Opção de Geolocalização com consentimento prévio explícito */}
        <div className="mt-4">
          {!askingGeoConsent ? (
            <button
              type="button"
              onClick={() => setAskingGeoConsent(true)}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-brand-blue/30 bg-brand-light/70 px-4 py-3 text-sm font-semibold text-brand-blue transition hover:bg-brand-light"
            >
              <Navigation className="h-4 w-4" />
              Calcular distância pelo GPS do meu dispositivo
            </button>
          ) : (
            <div className="rounded-xl border border-brand-blue/40 bg-brand-light/50 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                <div className="text-xs text-slate-700">
                  <p className="font-semibold text-brand-navy">
                    Permissão de Localização (LGPD)
                  </p>
                  <p className="mt-1">
                    Utilizamos suas coordenadas apenas para calcular a distância
                    em quilômetros até os mercados cadastrados. Deseja
                    autorizar?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmGeolocation}
                      disabled={loadingGeo}
                      className="min-h-[44px] rounded-lg bg-brand-blue px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-navy"
                    >
                      {loadingGeo
                        ? "Obtendo coordenadas..."
                        : "Autorizar GPS agora"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAskingGeoConsent(false)}
                      className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Usar CEP manualmente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {geoError && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            {geoError}
          </div>
        )}

        {/* Atalhos rápidos de Bairros */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Regiões atendidas em São Paulo:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_REGIONS.map((reg) => (
              <button
                key={reg.zipCode}
                type="button"
                onClick={() => {
                  setNeighborhood(reg.neighborhood);
                  setCity(reg.city);
                  setZipCode(reg.zipCode);
                  setCoords({ lat: reg.lat, lng: reg.lng });
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  neighborhood === reg.neighborhood
                    ? "border-brand-blue bg-brand-blue text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-blue"
                }`}
              >
                {reg.neighborhood} ({reg.zipCode})
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveManual} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="input-cep"
                className="block text-xs font-semibold text-slate-700"
              >
                CEP (Consulta automática ViaCEP)
              </label>
              <div className="mt-1 flex gap-1.5">
                <input
                  id="input-cep"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="04101-000"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleViaCepLookup}
                  disabled={loadingGeo}
                  className="inline-flex items-center gap-1 rounded-xl bg-brand-light px-3 py-2 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white"
                  aria-label="Buscar CEP via API ViaCEP"
                >
                  <Search className="h-3.5 w-3.5" />
                  Buscar
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="input-cidade"
                className="block text-xs font-semibold text-slate-700"
              >
                Cidade
              </label>
              <input
                id="input-cidade"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="input-bairro"
              className="block text-xs font-semibold text-slate-700"
            >
              Bairro
            </label>
            <input
              id="input-bairro"
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex.: Vila Mariana"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Raio máximo de distância dos mercados:{" "}
              <span className="font-bold text-brand-blue">{maxRadiusKm} km</span>
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setMaxRadiusKm(km)}
                  className={`min-h-[44px] rounded-xl border py-2 text-xs font-semibold transition ${
                    maxRadiusKm === km
                      ? "border-brand-green bg-brand-green text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Até {km} km
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-navy"
            >
              Confirmar Localização
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
