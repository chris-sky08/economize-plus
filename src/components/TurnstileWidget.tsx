"use client";

import React, { useEffect, useRef } from "react";

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
    return null;
  }

  return <div ref={containerRef} className="my-2 min-h-[65px]" />;
}
