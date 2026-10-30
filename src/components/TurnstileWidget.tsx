"use client";

import React, { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
}

export default function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current && window.turnstile.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerify(token),
        "expired-callback": () => onVerify(""),
        "error-callback": () => onVerify(""),
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existingScript = document.getElementById("cf-turnstile-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", renderWidget);
    }
  }, [siteKey, onVerify]);

  if (!siteKey) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <p className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="h-4 w-4 text-amber-700" />
          Proteção anti-spam Cloudflare Turnstile
        </p>
        <p className="mt-0.5 text-[11px] text-amber-800">
          Defina <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> e{" "}
          <code>TURNSTILE_SECRET_KEY</code> no painel da Vercel para ativar o
          envio de formulários públicos.
        </p>
      </div>
    );
  }

  return <div ref={containerRef} className="my-2 min-h-[65px]" />;
}
