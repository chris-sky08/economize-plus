"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { validateGtin } from "@/lib/format";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetectedEan: (ean: string) => void;
}

interface CameraOption {
  id: string;
  label: string;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetectedEan,
}: BarcodeScannerModalProps) {
  const [manualEan, setManualEan] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [cameras, setCameras] = useState<CameraOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  const onDetectedRef = useRef(onDetectedEan);
  onDetectedRef.current = onDetectedEan;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasDetectedRef = useRef(false);
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
    getState?: () => number;
    isScanning?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    hasDetectedRef.current = false;
    setCameraError(null);
    setValidationError(null);
    setCameraStarting(true);

    const stopSafely = async (
      instance: {
        stop: () => Promise<void>;
        clear: () => void;
        getState?: () => number;
        isScanning?: boolean;
      } | null
    ) => {
      if (!instance) return;
      try {
        const state = instance.getState?.();
        const active =
          state !== undefined ? state === 2 || state === 3 : instance.isScanning;
        if (active) {
          await instance.stop();
        }
      } catch {
        // Ignora erro caso câmera já tenha parado
      }
      try {
        instance.clear();
      } catch {
        // Ignora erro de limpeza DOM
      }
    };

    const startScanner = async () => {
      try {
        const html5Module = await import("html5-qrcode");
        if (!isMounted) return;

        const { Html5Qrcode, Html5QrcodeSupportedFormats } = html5Module;

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ];

        const html5QrCode = new Html5Qrcode("economize-barcode-reader", {
          verbose: false,
          formatsToSupport,
          useBarCodeDetectorIfSupported: true,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = html5QrCode;

        const scanConfig = {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
            width: Math.max(
              180,
              Math.min(310, Math.floor(viewfinderWidth * 0.85))
            ),
            height: Math.max(
              95,
              Math.min(150, Math.floor(viewfinderHeight * 0.45))
            ),
          }),
          disableFlip: false,
        };

        const handleSuccess = (decodedText: string) => {
          if (!isMounted || hasDetectedRef.current) return;
          const clean = decodedText.replace(/\D/g, "");
          if (!clean) return;

          const check = validateGtin(clean);
          if (check.valid) {
            hasDetectedRef.current = true;
            void stopSafely(html5QrCode).then(() => {
              if (isMounted) {
                onDetectedRef.current(check.normalized);
              }
            });
          } else {
            setValidationError(
              `Código lido (${clean}), mas não é um EAN válido: ${
                check.reason || "formato incompatível."
              }`
            );
          }
        };

        const handleFrameError = () => {
          // Quadro sem código visível
        };

        const cameraTarget: string | MediaTrackConstraints = selectedCameraId
          ? selectedCameraId
          : {
              facingMode: "environment",
            };

        const hdConfig = {
          ...scanConfig,
          videoConstraints: selectedCameraId
            ? {
                deviceId: { exact: selectedCameraId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
        };

        try {
          await html5QrCode.start(
            cameraTarget,
            hdConfig,
            handleSuccess,
            handleFrameError
          );
        } catch {
          // Fallback 1: Tenta sem videoConstraints HD restritas
          try {
            await html5QrCode.start(
              cameraTarget,
              scanConfig,
              handleSuccess,
              handleFrameError
            );
          } catch {
            // Fallback 2: Lista câmeras disponíveis e seleciona câmera traseira ou primeira disponível
            const available = await Html5Qrcode.getCameras();
            if (!isMounted) return;
            if (!available || available.length === 0) {
              throw new Error("Nenhuma câmera encontrada.");
            }
            const backCam =
              available.find((c) =>
                /back|rear|traseira|environment/i.test(c.label)
              ) || available[0];
            await html5QrCode.start(
              backCam.id,
              scanConfig,
              handleSuccess,
              handleFrameError
            );
          }
        }

        if (isMounted) {
          setCameraStarting(false);
          try {
            const available = await Html5Qrcode.getCameras();
            if (isMounted && available.length > 0) {
              setCameras(
                available.map((c, idx) => ({
                  id: c.id,
                  label: c.label || `Câmera ${idx + 1}`,
                }))
              );
            }
          } catch {
            // Ignora se enumeração falhar após start
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setCameraStarting(false);
          const msg = err instanceof Error ? err.message : "";
          const isPermissionDenied = /notallowed|permission|denied/i.test(msg);
          setCameraError(
            isPermissionDenied
              ? "Permissão da câmera bloqueada. Autorize a câmera no navegador, envie uma foto abaixo ou digite os dígitos do código EAN."
              : "Câmera ao vivo indisponível neste navegador. Use o botão 'Ler por Foto' abaixo ou digite os 13 dígitos manualmente."
          );
        }
      }
    };

    void startScanner();

    return () => {
      isMounted = false;
      const current = scannerRef.current;
      scannerRef.current = null;
      void stopSafely(current);
    };
  }, [isOpen, selectedCameraId]);

  if (!isOpen) return null;

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setPhotoLoading(true);
    setValidationError(null);
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      const fileScanner = new Html5Qrcode("economize-barcode-file-reader", {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.ITF,
        ],
        useBarCodeDetectorIfSupported: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      const decodedText = await fileScanner.scanFile(file, false);
      try {
        fileScanner.clear();
      } catch {
        // Ignora
      }

      const clean = decodedText.replace(/\D/g, "");
      const check = validateGtin(clean);
      if (!check.valid) {
        setValidationError(
          check.reason ||
            `Código lido na foto (${clean}), mas não é um código EAN válido.`
        );
        return;
      }

      hasDetectedRef.current = true;
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState?.();
          if (state === 2 || state === 3) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch {
          // Ignora
        }
        scannerRef.current = null;
      }
      onDetectedRef.current(check.normalized);
    } catch {
      setValidationError(
        "Não foi possível identificar um código de barras nítido nessa foto. Tente fotografar mais de perto ou digite os números abaixo."
      );
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualEan.replace(/\D/g, "");
    const check = validateGtin(clean);
    if (!check.valid) {
      setValidationError(
        check.reason ||
          "Código de barras inválido. Digite um código GTIN/EAN real de 8, 12, 13 ou 14 dígitos com dígito verificador válido."
      );
      return;
    }
    setValidationError(null);
    onDetectedRef.current(check.normalized);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-scanner-titulo"
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-navy">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="modal-scanner-titulo"
                className="font-heading text-base font-bold text-brand-navy"
              >
                Escanear Código de Barras (EAN)
              </h2>
              <p className="text-xs text-slate-500">
                Aponte para o código na horizontal e mantenha boa luz
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Fechar leitor de código de barras"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Área do Leitor de Câmera html5-qrcode */}
        <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-brand-blue/40 bg-slate-900">
          {cameraStarting && !cameraError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/90 text-xs font-medium text-white">
              <Loader2 className="h-6 w-6 animate-spin text-brand-yellow" />
              <span>Ativando câmera...</span>
            </div>
          )}
          <div id="economize-barcode-reader" className="min-h-[220px] w-full" />
        </div>

        {/* Controles rápidos de câmera e leitura por foto */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoScan}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoLoading}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-blue/30 bg-brand-light px-3 py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-blue/15 disabled:opacity-60"
          >
            {photoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4 text-brand-blue" />
            )}
            <span>{photoLoading ? "Lendo foto..." : "Ler por Foto / Galeria"}</span>
          </button>

          {cameras.length > 1 && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Trocar Lente</span>
            </button>
          )}
        </div>

        <div id="economize-barcode-file-reader" className="hidden" />

        {cameraError && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            {cameraError}
          </div>
        )}

        {validationError && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
            {validationError}
          </div>
        )}

        {/* Entrada Manual de EAN com Validação GTIN */}
        <form onSubmit={handleManualSubmit} className="mt-4">
          <label
            htmlFor="manual-ean-input"
            className="block text-xs font-bold text-slate-700"
          >
            Ou digite o código de barras EAN-8 / EAN-13 manualmente:
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="manual-ean-input"
              type="text"
              inputMode="numeric"
              value={manualEan}
              onChange={(e) => {
                setManualEan(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Ex: 7891000100103"
              className="min-h-[44px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-blue focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2 text-xs font-bold text-white hover:bg-brand-blue"
            >
              <Search className="h-3.5 w-3.5" />
              Consultar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
