"use client";

import React, { useEffect, useRef, useState } from "react";
import { Barcode, Camera, Search, X } from "lucide-react";

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
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(
    null
  );

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setCameraError(null);

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
              if (clean.length >= 8) {
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
                "Câmera não disponível ou permissão não concedida. Digite ou escolha um código EAN abaixo."
              );
            }
          });
      })
      .catch(() => {
        if (isMounted) {
          setCameraError(
            "Não foi possível inicializar o leitor de câmera. Utilize a digitação manual do EAN abaixo."
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
    if (clean.length >= 8) {
      onDetectedEan(clean);
    }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand-blue">
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
                Aponte a câmera para a embalagem do produto
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

        {/* Entrada Manual ou Teste Rápido de EAN Real no Open Food Facts */}
        <form onSubmit={handleManualSubmit} className="mt-4">
          <label
            htmlFor="manual-ean-input"
            className="block text-xs font-bold text-slate-700"
          >
            Ou digite o código de barras EAN-13 manualmente:
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="manual-ean-input"
              type="text"
              value={manualEan}
              onChange={(e) => setManualEan(e.target.value)}
              placeholder="Ex: 7891000100103 (Leite Moça)"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-brand-blue focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-brand-navy"
            >
              <Search className="h-3.5 w-3.5" />
              Buscar EAN
            </button>
          </div>
        </form>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-semibold text-slate-500">
            Códigos EAN reais do Open Food Facts Brasil para testar:
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              { ean: "7891000100103", label: "Leite Condensado Moça 395g" },
              { ean: "7891991010856", label: "Guaraná Antarctica 2L" },
              { ean: "7891000053508", label: "Achocolatado Nescau 370g" },
            ].map((sample) => (
              <button
                key={sample.ean}
                type="button"
                onClick={() => onDetectedEan(sample.ean)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:border-brand-blue hover:text-brand-blue"
              >
                <Barcode className="h-3 w-3 text-brand-blue" />
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
