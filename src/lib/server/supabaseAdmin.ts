import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getServerSupabaseConfig(): {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
} {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  return { url, anonKey, serviceRoleKey };
}

export function createServerAnonClient(accessToken?: string): SupabaseClient {
  const { url, anonKey } = getServerSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Configuração ausente: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias."
    );
  }
  const cleanToken = accessToken?.trim();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: cleanToken
      ? {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        }
      : undefined,
  });
}

export function createServiceRoleClient(
  fallbackAccessToken?: string
): SupabaseClient {
  const { url, serviceRoleKey, anonKey } = getServerSupabaseConfig();
  if (!url) {
    throw new Error(
      "Configuração ausente: NEXT_PUBLIC_SUPABASE_URL é obrigatória no servidor."
    );
  }
  const keyToUse = serviceRoleKey || anonKey;
  if (!keyToUse) {
    throw new Error(
      "Configuração ausente: SUPABASE_SERVICE_ROLE_KEY é obrigatória para operações privilegiadas no servidor."
    );
  }
  const cleanFallbackToken = fallbackAccessToken?.trim();
  const useUserJwt = !serviceRoleKey && Boolean(cleanFallbackToken);

  return createClient(url, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: useUserJwt
      ? {
          headers: {
            Authorization: `Bearer ${cleanFallbackToken}`,
          },
        }
      : undefined,
  });
}

export function hasServiceRoleKey(): boolean {
  return Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim());
}
