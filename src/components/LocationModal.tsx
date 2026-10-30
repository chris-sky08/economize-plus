"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Navigation, Search, ShieldCheck, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useUserLocation } from "@/hooks/useUserLocation";

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
    lookupCepReal,
    requestDeviceCoordinates,
  } = useUserLocation();

  const [neighborhood, setNeighborhood] = useState<string>(
    location.neighborhood || ""
  );
  const [city, setCity] = useState<string>(location.city || "");
  const [stateCode, setStateCode] = useState<string>(location.state || "");
  const [zipCode, setZipCode] = useState<string>(location.zipCode || "");
  const [coords, setCoords] = useState<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: location.lat,
    lng: location.lng,
  });
  const [maxRadiusKm, setMaxRadiusKm] = useState(location.maxRadiusKm);
  const [askingGeoConsent, setAskingGeoConsent] = useState(false);

  useEffect(() => {
    setNeighborhood(location.neighborhood || "");
    setCity(location.city || "");
    setStateCode(location.state || "");
    setZipCode(location.zipCode || "");
    setCoords({ lat: location.lat, lng: location.lng });
    setMaxRadiusKm(location.maxRadiusKm);
  }, [location, isLocationModalOpen]);

  if (!isLocationModalOpen) return null;

  const handleCepLookup = async () => {
    const res = await lookupCepReal(zipCode);
    if (res) {
      setNeighborhood(res.neighborhood || "");
      setCity(res.city || "");
      setStateCode(res.state || "");
      setZipCode(res.zipCode || "");
      setCoords({ lat: res.lat, lng: res.lng });
      if (res.lat !== null && res.lng !== null) {
        showToast(
          `CEP localizado com coordenadas: ${res.neighborhood || res.city}/${res.state}`
        );
      } else {
        showToast(
          `Endereço localizado (${res.city}/${res.state}), mas sem coordenadas exatas para cálculo de distância.`
        );
      }
    }
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    updateLocation({
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: stateCode.trim(),
      zipCode: zipCode.trim(),
      lat: coords.lat,
      lng: coords.lng,
      maxRadiusKm,
      configured: Boolean(
        zipCode.trim() || city.trim() || (coords.lat !== null && coords.lng !== null)
      ),
    });
    setIsLocationModalOpen(false);
  };

  const handleConfirmGeolocation = async () => {
    const deviceCoords = await requestDeviceCoordinates();
    if (deviceCoords) {
      setAskingGeoConsent(false);
      updateLocation({
        neighborhood: neighborhood.trim() || "Localização via GPS",
        city: city.trim(),
        state: stateCode.trim(),
        lat: deviceCoords.lat,
        lng: deviceCoords.lng,
        deviceLocationGranted: true,
        configured: true,
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-navy">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-localizacao-titulo"
                className="font-heading text-lg font-bold text-brand-navy"
              >
                Definir sua localização
              </h2>
              <p className="text-xs text-slate-500">
                Calculamos a distância aproximada em linha reta até cada mercado.
              </p>
            </div>
          </div>
          <button
            type="button"
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
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-brand-blue/30 bg-brand-light/70 px-4 py-3 text-sm font-semibold text-brand-navy transition hover:bg-brand-light"
            >
              <Navigation className="h-4 w-4 text-brand-blue" />
              Usar GPS do meu dispositivo
            </button>
          ) : (
            <div className="rounded-xl border border-brand-blue/40 bg-brand-light/50 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" />
                <div className="text-xs text-slate-700">
                  <p className="font-semibold text-brand-navy">
                    Permissão de Localização (LGPD)
                  </p>
                  <p className="mt-1">
                    Utilizamos suas coordenadas apenas no navegador para
                    calcular a distância em linha reta até os mercados
                    cadastrados. Deseja autorizar?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmGeolocation}
                      disabled={loadingGeo}
                      className="min-h-[44px] rounded-lg bg-brand-navy px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-blue"
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
                      Informar CEP manualmente
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

        <form onSubmit={handleSaveManual} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="input-cep"
                className="block text-xs font-semibold text-slate-700"
              >
                CEP (Consulta real ViaCEP + Geocodificação)
              </label>
              <div className="mt-1 flex gap-1.5">
                <input
                  id="input-cep"
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Digite seu CEP (8 dígitos)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCepLookup}
                  disabled={loadingGeo}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-brand-light px-3 py-2 text-xs font-bold text-brand-navy hover:bg-brand-blue hover:text-white"
                  aria-label="Buscar CEP"
                >
                  <Search className="h-3.5 w-3.5" />
                  {loadingGeo ? "..." : "Buscar"}
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
                placeholder="Preenchido pelo CEP"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
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
                placeholder="Preenchido pelo CEP"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="input-uf"
                className="block text-xs font-semibold text-slate-700"
              >
                UF
              </label>
              <input
                id="input-uf"
                type="text"
                maxLength={2}
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                placeholder="UF"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            {coords.lat !== null && coords.lng !== null ? (
              <span>
                Coordenadas ativas para cálculo de distância:{" "}
                <strong className="tabular-price text-brand-navy">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </strong>
              </span>
            ) : (
              <span>
                Sem coordenadas geográficas ativas. Clique em{" "}
                <strong>Buscar</strong> após digitar o CEP ou autorize o GPS
                para calcular a distância até cada mercado.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Raio máximo de distância dos mercados:{" "}
              <span className="font-bold text-brand-navy">{maxRadiusKm} km</span>
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {[2, 5, 10, 25].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setMaxRadiusKm(km)}
                  className={`min-h-[44px] rounded-xl border py-2 text-xs font-semibold transition ${
                    maxRadiusKm === km
                      ? "border-brand-navy bg-brand-navy text-white"
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
              Fechar
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-blue"
            >
              Salvar Localização
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
