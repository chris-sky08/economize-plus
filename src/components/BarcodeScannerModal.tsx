"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Search, X } from "lucide-react";
import { validateGtin } from "@/lib/format";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetectedEan: (ean: string) => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetectedEan,
}: BarcodeScannerModalProps) {
  const [manualEan, setManualEan] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setCameraError(null);
    setValidationError(null);

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (!isMounted) return;
        const html5QrCode = new Html5Qrcode("economize-barcode-reader");
        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 140 },
            },
            (decodedText) => {
              const clean = decodedText.replace(/\D/g, "");
              if (validateGtin(clean).valid) {
                html5QrCode
                  .stop()
                  .then(() => html5QrCode.clear())
                  .catch(() => {});
                onDetectedEan(clean);
              }
            },
            () => {
              // Ignora frames sem código detectado
            }
          )
          .catch(() => {
            if (isMounted) {
              setCameraError(
                "Câmera não disponível ou permissão não concedida. Digite o código de barras EAN-8/EAN-13 abaixo."
              );
            }
          });
      })
      .catch(() => {
        if (isMounted) {
          setCameraError(
            "Não foi possível inicializar o leitor de câmera. Utilize a digitação manual do código EAN abaixo."
          );
        }
      });

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isOpen, onDetectedEan]);

  if (!isOpen) return null;

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
    onDetectedEan(check.normalized);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-scanner-titulo"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
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
                Aponte a câmera para o código de barras da embalagem
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
        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-brand-blue/40 bg-slate-900">
          <div id="economize-barcode-reader" className="min-h-[210px] w-full" />
        </div>

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
              placeholder="Digite os 13 dígitos do código de barras"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-blue focus:outline-none"
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
