"use client";

import React, { useState } from "react";
import { MapPin, Navigation, ShieldCheck, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

const DEMO_REGIONS = [
  { neighborhood: "Vila Mariana", city: "São Paulo", zipCode: "04101-000" },
  { neighborhood: "Saúde", city: "São Paulo", zipCode: "04045-000" },
  { neighborhood: "Ipiranga", city: "São Paulo", zipCode: "04208-000" },
  { neighborhood: "Moema", city: "São Paulo", zipCode: "04077-000" },
  { neighborhood: "Centro (Bairro Sem Mercados no Raio 1km)", city: "São Paulo", zipCode: "01001-000" },
];

export default function LocationModal() {
  const {
    location,
    updateLocation,
    isLocationModalOpen,
    setIsLocationModalOpen,
    showToast,
  } = useApp();

  const [neighborhood, setNeighborhood] = useState(location.neighborhood);
  const [city, setCity] = useState(location.city);
  const [zipCode, setZipCode] = useState(location.zipCode);
  const [maxRadiusKm, setMaxRadiusKm] = useState(location.maxRadiusKm);
  const [askingGeoConsent, setAskingGeoConsent] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);

  if (!isLocationModalOpen) return null;

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    updateLocation({
      neighborhood: neighborhood.trim() || "Vila Mariana",
      city: city.trim() || "São Paulo",
      zipCode: zipCode.trim() || "04101-000",
      maxRadiusKm,
    });
    setIsLocationModalOpen(false);
  };

  const handleConfirmGeolocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      showToast(
        "Seu navegador não suporta geolocalização. Use a seleção manual abaixo."
      );
      setAskingGeoConsent(false);
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLoadingGeo(false);
        setAskingGeoConsent(false);
        updateLocation({
          neighborhood: "Vila Mariana (Localização Aproximada)",
          city: "São Paulo",
          zipCode: "04101-000",
          deviceLocationGranted: true,
        });
        setIsLocationModalOpen(false);
      },
      () => {
        setLoadingGeo(false);
        setAskingGeoConsent(false);
        showToast(
          "Permissão de localização não concedida. Você pode escolher seu bairro ou CEP manualmente."
        );
      },
      { timeout: 6000 }
    );
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
                Mostramos apenas mercados parceiros dentro do raio escolhido.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar janela de localização"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
          <strong>Aviso de Demonstração:</strong> As localizações e distâncias
          deste MVP são fictícias e não representam proximidade física real.
        </div>

        {/* Opção de Geolocalização com consentimento prévio explícito */}
        <div className="mt-4">
          {!askingGeoConsent ? (
            <button
              type="button"
              onClick={() => setAskingGeoConsent(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-blue/30 bg-brand-light/70 px-4 py-3 text-sm font-semibold text-brand-blue transition hover:bg-brand-light"
            >
              <Navigation className="h-4 w-4" />
              Usar localização do meu dispositivo (Opcional)
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
                    Utilizamos sua localização apenas durante a sessão para
                    sugerir a região mais próxima. Não armazenamos coordenadas
                    GPS precisas no servidor. Deseja autorizar?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmGeolocation}
                      disabled={loadingGeo}
                      className="rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-navy"
                    >
                      {loadingGeo
                        ? "Solicitando..."
                        : "Autorizar localização agora"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAskingGeoConsent(false)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Prefiro digitar manualmente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Atalhos rápidos de Bairros Demonstrativos */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bairros demonstrativos rápidos:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEMO_REGIONS.map((reg) => (
              <button
                key={reg.zipCode}
                type="button"
                onClick={() => {
                  setNeighborhood(reg.neighborhood);
                  setCity(reg.city);
                  setZipCode(reg.zipCode);
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
                CEP
              </label>
              <input
                id="input-cep"
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="04101-000"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
              />
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
            <label
              htmlFor="input-raio"
              className="block text-xs font-semibold text-slate-700"
            >
              Raio máximo de distância dos mercados:{" "}
              <span className="font-bold text-brand-blue">{maxRadiusKm} km</span>
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setMaxRadiusKm(km)}
                  className={`rounded-xl border py-2 text-xs font-semibold transition ${
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
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-navy"
            >
              Confirmar Localização
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
