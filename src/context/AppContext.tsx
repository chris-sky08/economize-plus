"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Category,
  CourierApplication,
  LocationConfig,
  Market,
  MarketPrice,
  PartnerApplication,
  PriceReport,
  PriceSource,
  Product,
  ShoppingListItem,
  UserProfile,
  UserRole,
} from "@/types/domain";
import {
  CATEGORIES,
  formatDateTimeBR,
} from "@/lib/format";
import {
  fetchCatalogFromSupabase,
  isSupabaseConfigured,
  mapDbPriceRow,
  mapDbProductRow,
  supabase,
  supabaseConfigError,
} from "@/lib/supabase";
import { calculateHaversineKm } from "@/hooks/useUserLocation";

export type {
  UserRole,
  UserProfile,
  ShoppingListItem,
  LocationConfig,
};

export const SHOPPING_LIST_STORAGE_KEY = "economize_shopping_list_v2";
export const LOCATION_STORAGE_KEY = "economize_location_v2";

const LEGACY_SHOPPING_LIST_KEYS = [
  "economize_shopping_list",
  "economize_shopping_list_v1",
];

const LEGACY_LOCATION_KEYS = [
  "economize_location",
  "economize_location_v1",
];

function isValidShoppingListItem(item: unknown): item is ShoppingListItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Record<string, unknown>;
  const productId =
    typeof candidate.productId === "string" ? candidate.productId.trim() : "";
  const quantity =
    typeof candidate.quantity === "number" ? candidate.quantity : 0;
  if (!productId || quantity <= 0 || !Number.isFinite(quantity)) return false;
  if (/^(prod-|mock-|item-|demo-|fake-|sample-|test-)/i.test(productId)) {
    return false;
  }
  return true;
}

interface AppContextType {
  categories: Category[];
  markets: Market[];
  products: Product[];
  prices: MarketPrice[];
  shoppingList: ShoppingListItem[];
  location: LocationConfig;
  user: UserProfile | null;
  accessToken: string | null;
  toast: string | null;
  catalogLoading: boolean;
  catalogError: string | null;
  partnerApplications: PartnerApplication[];
  courierApplications: CourierApplication[];
  priceReports: PriceReport[];
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  updateLocation: (loc: Partial<LocationConfig>) => void;
  refreshCatalog: () => Promise<void>;
  registerExternalProduct: (product: Product) => void;
  addToList: (productId: string, qty?: number) => void;
  removeFromList: (productId: string) => void;
  updateListQuantity: (productId: string, qty: number) => void;
  toggleListItemChecked: (productId: string) => void;
  clearList: () => void;
  saveListToSupabase: () => Promise<void>;
  logoutUser: () => Promise<void>;
  syncSessionFromToken: (token: string) => Promise<UserProfile | null>;
  showToast: (msg: string) => void;
  upsertMarketPrice: (
    marketId: string,
    productId: string,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    inStock?: boolean,
    source?: PriceSource,
    validUntil?: string | null
  ) => Promise<boolean>;
  addNewProductWithPrice: (
    marketId: string,
    product: Omit<Product, "id" | "source" | "dataStatus">,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    source?: PriceSource
  ) => Promise<boolean>;
  removeMarketPrice: (marketId: string, productId: string) => Promise<boolean>;
  updateMarketProfile: (
    marketId: string,
    updates: Partial<
      Pick<
        Market,
        "phone" | "openingHours" | "deliveryAvailable" | "deliveryInfo"
      >
    >
  ) => Promise<boolean>;
  submitPartnerApplication: (
    app: Omit<PartnerApplication, "id" | "status" | "createdAt">,
    turnstileToken: string
  ) => Promise<{ ok: boolean; error?: string }>;
  submitCourierApplication: (
    app: Omit<CourierApplication, "id" | "status" | "createdAt">,
    turnstileToken: string
  ) => Promise<{ ok: boolean; error?: string }>;
  submitPriceReport: (
    marketId: string,
    productId: string,
    reason: string,
    details: string,
    turnstileToken: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updatePartnerApplicationStatus: (
    id: string,
    status: "em_analise" | "aprovado" | "recusado"
  ) => Promise<void>;
  updatePriceReportStatus: (
    id: string,
    status: "pendente" | "revisado" | "arquivado"
  ) => Promise<void>;
  toggleMarketStatus: (marketId: string) => Promise<void>;
  toggleSponsoredPrice: (priceId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const EMPTY_LOCATION_STATE: LocationConfig = {
  city: null,
  neighborhood: null,
  state: null,
  zipCode: null,
  lat: null,
  lng: null,
  maxRadiusKm: 10,
  deviceLocationGranted: false,
  configured: false,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rawMarkets, setRawMarkets] = useState<Market[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [location, setLocation] = useState<LocationConfig>(
    EMPTY_LOCATION_STATE
  );
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(
    supabaseConfigError
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [partnerApplications, setPartnerApplications] = useState<
    PartnerApplication[]
  >([]);
  const [courierApplications, setCourierApplications] = useState<
    CourierApplication[]
  >([]);
  const [priceReports, setPriceReports] = useState<PriceReport[]>([]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 4200);
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    const result = await fetchCatalogFromSupabase({ page: 0, pageSize: 150 });
    setRawMarkets(result.supermarkets);
    setProducts(result.products);
    setPrices(result.prices);
    setCatalogError(result.error);
    setCatalogLoading(false);
  }, []);

  const loadAdminRecords = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const [appsRes, couriersRes, reportsRes] = await Promise.all([
      supabase
        .from("partner_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, 99),
      supabase
        .from("couriers")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, 99),
      supabase
        .from("price_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, 99),
    ]);

    if (!appsRes.error && Array.isArray(appsRes.data)) {
      setPartnerApplications(
        appsRes.data.map((a) => ({
          id: String(a.id),
          marketName: String(a.market_name),
          responsibleName: String(a.responsible_name),
          email: String(a.email),
          phone: String(a.phone),
          address: String(a.address),
          neighborhood: String(a.neighborhood),
          city: String(a.city),
          zipCode: String(a.zip_code),
          desiredPlan: a.desired_plan === "premium" ? "premium" : "basico",
          status:
            a.status === "aprovado" || a.status === "recusado"
              ? a.status
              : "em_analise",
          createdAt: formatDateTimeBR(String(a.created_at || "")),
        }))
      );
    }

    if (!couriersRes.error && Array.isArray(couriersRes.data)) {
      setCourierApplications(
        couriersRes.data.map((c) => ({
          id: String(c.id),
          fullName: String(c.full_name),
          email: String(c.email),
          phone: String(c.phone),
          vehicleType:
            c.vehicle_type === "bicicleta" ||
            c.vehicle_type === "carro" ||
            c.vehicle_type === "utilitario"
              ? c.vehicle_type
              : "moto",
          serviceNeighborhoods: Array.isArray(c.service_neighborhoods)
            ? c.service_neighborhoods.map(String)
            : [],
          status:
            c.status === "em_analise" ||
            c.status === "aprovado" ||
            c.status === "suspenso"
              ? c.status
              : "pre_cadastro",
          createdAt: formatDateTimeBR(String(c.created_at || "")),
        }))
      );
    }

    if (!reportsRes.error && Array.isArray(reportsRes.data)) {
      setPriceReports(
        reportsRes.data.map((r) => ({
          id: String(r.id),
          marketId: String(r.supermarket_id || ""),
          productId: String(r.product_id || ""),
          reason: String(r.reason),
          details: String(r.details || ""),
          status:
            r.status === "revisado" || r.status === "arquivado"
              ? r.status
              : "pendente",
          createdAt: formatDateTimeBR(String(r.created_at || "")),
        }))
      );
    }
  }, []);

  const syncSessionFromToken = useCallback(
    async (token: string): Promise<UserProfile | null> => {
      try {
        setAccessToken(token);
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: token }),
        });
        if (!res.ok) {
          setUser(null);
          return null;
        }
        const data = (await res.json()) as { user?: UserProfile };
        if (data.user) {
          setUser(data.user);
          if (data.user.role === "admin") {
            void loadAdminRecords();
          }
          return data.user;
        }
        return null;
      } catch {
        return null;
      }
    },
    [loadAdminRecords]
  );

  useEffect(() => {
    try {
      // Remove imediatamente chaves antigas legadas para eliminar itens fantasmas (como os 5 itens / 10 unidades antigos)
      for (const legacyKey of LEGACY_SHOPPING_LIST_KEYS) {
        localStorage.removeItem(legacyKey);
      }
      for (const legacyLocKey of LEGACY_LOCATION_KEYS) {
        localStorage.removeItem(legacyLocKey);
      }

      const savedList = localStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
      if (savedList) {
        const parsedList = JSON.parse(savedList) as unknown;
        if (Array.isArray(parsedList)) {
          const validItems = parsedList
            .filter(isValidShoppingListItem)
            .map((item) => ({
              productId: item.productId.trim(),
              quantity: Math.max(1, Math.round(item.quantity)),
              checked: item.checked !== false,
            }));
          setShoppingList(validItems);
        }
      }

      const savedLoc = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc) as Partial<LocationConfig>;
        if (
          parsed &&
          parsed.configured !== false &&
          (parsed.city || parsed.zipCode || parsed.lat !== null)
        ) {
          setLocation({
            city: parsed.city ?? null,
            neighborhood: parsed.neighborhood ?? null,
            state: parsed.state ?? null,
            zipCode: parsed.zipCode ?? null,
            lat: typeof parsed.lat === "number" ? parsed.lat : null,
            lng: typeof parsed.lng === "number" ? parsed.lng : null,
            maxRadiusKm:
              typeof parsed.maxRadiusKm === "number" ? parsed.maxRadiusKm : 10,
            deviceLocationGranted: Boolean(parsed.deviceLocationGranted),
            configured: true,
          });
        }
      }
    } catch {
      // Ignora falha de leitura de localStorage
    }

    const handleClearLocalData = () => {
      setShoppingList([]);
      setLocation(EMPTY_LOCATION_STATE);
    };
    window.addEventListener("economize:clear-local-data", handleClearLocalData);

    void refreshCatalog();

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.access_token) {
          void syncSessionFromToken(data.session.access_token);
        }
      });

      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.access_token) {
            void syncSessionFromToken(session.access_token);
          } else {
            setAccessToken(null);
            setUser(null);
          }
        }
      );

      return () => {
        window.removeEventListener(
          "economize:clear-local-data",
          handleClearLocalData
        );
        listener.subscription.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener(
        "economize:clear-local-data",
        handleClearLocalData
      );
    };
  }, [refreshCatalog, syncSessionFromToken]);

  // Assim que o catálogo real do Supabase terminar de carregar, mantém na lista apenas produtos que realmente existem
  useEffect(() => {
    if (catalogLoading) return;
    const validProductIds = new Set(products.map((p) => p.id));
    setShoppingList((prev) => {
      const reconciled = prev.filter(
        (item) =>
          isValidShoppingListItem(item) && validProductIds.has(item.productId)
      );
      return reconciled.length === prev.length ? prev : reconciled;
    });
  }, [catalogLoading, products]);

  useEffect(() => {
    try {
      localStorage.setItem(
        SHOPPING_LIST_STORAGE_KEY,
        JSON.stringify(shoppingList)
      );
    } catch {
      // Ignora falha de escrita em localStorage
    }
  }, [shoppingList]);

  // Calcula a distância em linha reta (Haversine) apenas quando tanto o usuário quanto o mercado possuem coordenadas reais
  const markets = useMemo(() => {
    return rawMarkets.map((m) => ({
      ...m,
      distanceKm: calculateHaversineKm(
        location.lat,
        location.lng,
        m.lat,
        m.lng
      ),
    }));
  }, [rawMarkets, location.lat, location.lng]);

  const updateLocation = (loc: Partial<LocationConfig>) => {
    setLocation((prev) => {
      const isConfigured =
        loc.configured !== undefined ? loc.configured : true;
      const updated: LocationConfig = {
        ...prev,
        ...loc,
        configured: isConfigured,
      };
      try {
        if (isConfigured) {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(updated));
        } else {
          localStorage.removeItem(LOCATION_STORAGE_KEY);
        }
      } catch {
        // Ignora
      }
      return updated;
    });
    showToast("Localização atualizada!");
  };

  const registerExternalProduct = (product: Product) => {
    setProducts((prev) => {
      const existingIdx = prev.findIndex(
        (p) => p.id === product.id || (product.ean && p.ean === product.ean)
      );
      if (existingIdx !== -1) {
        return prev.map((p, idx) => (idx === existingIdx ? product : p));
      }
      return [product, ...prev];
    });
  };

  const addToList = (productId: string, qty = 1) => {
    const product = products.find((p) => p.id === productId);
    setShoppingList((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + qty, checked: true }
            : i
        );
      }
      return [...prev, { productId, quantity: qty, checked: true }];
    });
    showToast(
      `${product ? product.name : "Produto"} adicionado à sua Lista Inteligente!`
    );
  };

  const removeFromList = (productId: string) => {
    setShoppingList((prev) => prev.filter((i) => i.productId !== productId));
    showToast("Item removido da lista.");
  };

  const updateListQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromList(productId);
      return;
    }
    setShoppingList((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  const toggleListItemChecked = (productId: string) => {
    setShoppingList((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, checked: !i.checked } : i
      )
    );
  };

  const clearList = () => {
    setShoppingList([]);
    try {
      localStorage.removeItem(SHOPPING_LIST_STORAGE_KEY);
      for (const legacyKey of LEGACY_SHOPPING_LIST_KEYS) {
        localStorage.removeItem(legacyKey);
      }
    } catch {
      // Ignora
    }
    showToast("Lista de compras esvaziada.");
  };

  const saveListToSupabase = async () => {
    if (!user) {
      showToast(
        "Sua lista já está salva neste navegador. Faça login em /conta para sincronizar na nuvem."
      );
      return;
    }
    const { data: listData, error: listErr } = await supabase
      .from("shopping_lists")
      .insert({
        user_id: user.id,
        title: "Minha Lista Economize+",
      })
      .select()
      .single();

    if (listErr || !listData) {
      showToast(
        `Não foi possível salvar na nuvem (${listErr?.message || "erro"}). Sua lista continua salva no navegador.`
      );
      return;
    }

    if (shoppingList.length > 0) {
      const { error: itemsErr } = await supabase
        .from("shopping_list_items")
        .insert(
          shoppingList.map((item) => ({
            list_id: listData.id,
            product_id: item.productId,
            quantity: item.quantity,
            checked: item.checked,
          }))
        );

      if (itemsErr) {
        showToast(`Erro ao sincronizar itens da lista: ${itemsErr.message}`);
        return;
      }
    }

    showToast("Lista sincronizada com sua conta no Supabase!");
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    await fetch("/api/auth/session", { method: "DELETE" });
    setAccessToken(null);
    setUser(null);
    showToast("Sessão encerrada.");
  };

  const upsertMarketPrice = async (
    marketId: string,
    productId: string,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    inStock = true,
    source: PriceSource = "partner_manual",
    validUntil?: string | null
  ): Promise<boolean> => {
    if (!user) {
      showToast("Faça login com sua conta de mercado parceiro para atualizar preços.");
      return false;
    }

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("market_prices")
      .upsert(
        {
          supermarket_id: marketId,
          product_id: productId,
          price: Math.round(price * 100) / 100,
          is_promo: isPromo,
          promo_label: isPromo && promoLabel ? promoLabel : null,
          in_stock: inStock,
          source,
          status: source === "flyer_ocr" ? "pendente" : "publicado",
          valid_until: validUntil || null,
          collected_at: nowIso,
          submitted_by: user.id,
          updated_at: nowIso,
        },
        { onConflict: "supermarket_id,product_id" }
      )
      .select()
      .single();

    if (error || !data) {
      showToast(
        `Erro ao salvar preço no banco: ${error?.message || "permissão negada pelo RLS"}`
      );
      return false;
    }

    const mapped = mapDbPriceRow(data as Record<string, unknown>);
    setPrices((prev) => {
      const exists = prev.some(
        (p) => p.marketId === marketId && p.productId === productId
      );
      if (exists) {
        return prev.map((p) =>
          p.marketId === marketId && p.productId === productId ? mapped : p
        );
      }
      return [mapped, ...prev];
    });

    showToast("Preço gravado e confirmado no banco de dados!");
    return true;
  };

  const addNewProductWithPrice = async (
    marketId: string,
    product: Omit<Product, "id" | "source" | "dataStatus">,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    source: PriceSource = "partner_manual"
  ): Promise<boolean> => {
    if (!user) {
      showToast("Faça login para cadastrar produtos e preços.");
      return false;
    }
    const cleanEan = product.ean.replace(/\D/g, "");
    const newId = `ean-${cleanEan}`;

    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes.data.session?.access_token || accessToken;
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    // 1) Consulta produto via rota de servidor do EAN
    let ensuredProduct: Product | null = null;
    try {
      const getRes = await fetch(
        `/api/produtos/ean/${encodeURIComponent(cleanEan)}`,
        { headers: authHeaders }
      );
      if (getRes.ok) {
        const getData = (await getRes.json()) as { product?: Product };
        if (getData.product) {
          ensuredProduct = getData.product;
        }
      }
    } catch {
      // Prossegue para criação explícita via POST
    }

    // 2) Caso o EAN não conste no Open Food Facts ou o parceiro tenha informado dados cadastrais, garante o upsert em public.products via POST autenticado
    if (!ensuredProduct || product.name?.trim()) {
      try {
        const postRes = await fetch(
          `/api/produtos/ean/${encodeURIComponent(cleanEan)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders,
            },
            body: JSON.stringify({
              name: product.name || ensuredProduct?.name || "",
              brand: product.brand ?? ensuredProduct?.brand ?? null,
              category:
                product.categoryId ?? ensuredProduct?.categoryId ?? null,
              size_label:
                product.sizeLabel ?? ensuredProduct?.sizeLabel ?? null,
              unit_type: product.unitType ?? ensuredProduct?.unitType ?? null,
              unit_value:
                product.unitMultiplier ?? ensuredProduct?.unitMultiplier ?? null,
              image_url: product.imageUrl ?? ensuredProduct?.imageUrl ?? null,
              description:
                product.description ?? ensuredProduct?.description ?? null,
            }),
          }
        );
        if (postRes.ok) {
          const postData = (await postRes.json()) as { product?: Product };
          if (postData.product) {
            ensuredProduct = postData.product;
          }
        }
      } catch {
        // Segue para tentativa de vinculação de preço
      }
    }

    if (ensuredProduct) {
      registerExternalProduct(ensuredProduct);
    }

    const targetProductId = ensuredProduct?.id || newId;
    const ok = await upsertMarketPrice(
      marketId,
      targetProductId,
      price,
      isPromo,
      promoLabel,
      true,
      source
    );

    if (ok && !ensuredProduct) {
      const { data: prodRow } = await supabase
        .from("products")
        .select("*")
        .eq("id", targetProductId)
        .maybeSingle();
      if (prodRow) {
        registerExternalProduct(
          mapDbProductRow(prodRow as Record<string, unknown>)
        );
      }
    }
    return ok;
  };

  const removeMarketPrice = async (
    marketId: string,
    productId: string
  ): Promise<boolean> => {
    const { error } = await supabase
      .from("market_prices")
      .delete()
      .eq("supermarket_id", marketId)
      .eq("product_id", productId);

    if (error) {
      showToast(`Erro ao remover preço: ${error.message}`);
      return false;
    }

    setPrices((prev) =>
      prev.filter(
        (p) => !(p.marketId === marketId && p.productId === productId)
      )
    );
    showToast("Preço removido do catálogo.");
    return true;
  };

  const updateMarketProfile = async (
    marketId: string,
    updates: Partial<
      Pick<
        Market,
        "phone" | "openingHours" | "deliveryAvailable" | "deliveryInfo"
      >
    >
  ): Promise<boolean> => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.openingHours !== undefined)
      dbUpdates.opening_hours = updates.openingHours;
    if (updates.deliveryAvailable !== undefined)
      dbUpdates.delivery_available = updates.deliveryAvailable;
    if (updates.deliveryInfo !== undefined)
      dbUpdates.delivery_info = updates.deliveryInfo;

    const { error } = await supabase
      .from("supermarkets")
      .update(dbUpdates)
      .eq("id", marketId);

    if (error) {
      showToast(`Erro ao atualizar dados do mercado: ${error.message}`);
      return false;
    }

    const nowIso = new Date().toISOString();
    setRawMarkets((prev) =>
      prev.map((m) =>
        m.id === marketId
          ? {
              ...m,
              ...updates,
              updatedAtIso: nowIso,
              lastCatalogUpdate: formatDateTimeBR(nowIso),
            }
          : m
      )
    );
    showToast("Dados do estabelecimento atualizados no banco!");
    return true;
  };

  const submitPartnerApplication = async (
    app: Omit<PartnerApplication, "id" | "status" | "createdAt">,
    turnstileToken: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/public/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "partner",
          turnstileToken,
          payload: app,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        const errMsg = data.error || "Não foi possível enviar a solicitação.";
        showToast(errMsg);
        return {
          ok: false,
          error: errMsg,
        };
      }
      showToast("Solicitação de parceria registrada com sucesso!");
      return { ok: true };
    } catch {
      const errMsg = "Falha de comunicação ao enviar a solicitação.";
      showToast(errMsg);
      return {
        ok: false,
        error: errMsg,
      };
    }
  };

  const submitCourierApplication = async (
    app: Omit<CourierApplication, "id" | "status" | "createdAt">,
    turnstileToken: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/public/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "courier",
          turnstileToken,
          payload: app,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        const errMsg = data.error || "Não foi possível enviar o cadastro.";
        showToast(errMsg);
        return {
          ok: false,
          error: errMsg,
        };
      }
      showToast("Cadastro de entregador registrado com sucesso!");
      return { ok: true };
    } catch {
      const errMsg = "Falha de comunicação ao enviar o cadastro.";
      showToast(errMsg);
      return {
        ok: false,
        error: errMsg,
      };
    }
  };

  const submitPriceReport = async (
    marketId: string,
    productId: string,
    reason: string,
    details: string,
    turnstileToken: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/public/submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "price_report",
          turnstileToken,
          payload: { marketId, productId, reason, details },
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        const errMsg = data.error || "Não foi possível enviar o relato.";
        showToast(errMsg);
        return {
          ok: false,
          error: errMsg,
        };
      }
      showToast("Relato enviado para revisão administrativa!");
      return { ok: true };
    } catch {
      const errMsg = "Falha de comunicação ao enviar o relato.";
      showToast(errMsg);
      return {
        ok: false,
        error: errMsg,
      };
    }
  };

  const updatePartnerApplicationStatus = async (
    id: string,
    status: "em_analise" | "aprovado" | "recusado"
  ) => {
    const { error } = await supabase
      .from("partner_applications")
      .update({ status })
      .eq("id", id);

    if (error) {
      showToast(`Erro ao atualizar solicitação: ${error.message}`);
      return;
    }
    setPartnerApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    showToast(`Status da solicitação alterado para: ${status.toUpperCase()}`);
  };

  const updatePriceReportStatus = async (
    id: string,
    status: "pendente" | "revisado" | "arquivado"
  ) => {
    const { error } = await supabase
      .from("price_reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      showToast(`Erro ao atualizar relato: ${error.message}`);
      return;
    }
    setPriceReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    showToast(`Relato atualizado para: ${status}`);
  };

  const toggleMarketStatus = async (marketId: string) => {
    const current = rawMarkets.find((m) => m.id === marketId);
    if (!current) return;
    const nextStatus = current.status === "ativo" ? "suspenso" : "ativo";

    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes.data.session?.access_token || accessToken;

    let updatedViaApi = false;
    if (token) {
      try {
        const res = await fetch("/api/admin/mercados", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: marketId,
            action: "toggle_status",
            status: nextStatus,
          }),
        });
        if (res.ok) {
          updatedViaApi = true;
        }
      } catch {
        // Fallback para update direto
      }
    }

    if (!updatedViaApi) {
      const { error } = await supabase
        .from("supermarkets")
        .update({ status: nextStatus })
        .eq("id", marketId);

      if (error) {
        showToast(`Erro ao alterar status do mercado: ${error.message}`);
        return;
      }
    }

    setRawMarkets((prev) =>
      prev.map((m) => (m.id === marketId ? { ...m, status: nextStatus } : m))
    );
    showToast("Status do mercado atualizado no banco.");
  };

  const toggleSponsoredPrice = async (priceId: string) => {
    const current = prices.find((p) => p.id === priceId);
    if (!current) return;
    const nextSponsored = !current.isSponsored;
    const { error } = await supabase
      .from("market_prices")
      .update({ is_sponsored: nextSponsored })
      .eq("id", priceId);

    if (error) {
      showToast(`Erro ao atualizar destaque patrocinado: ${error.message}`);
      return;
    }
    setPrices((prev) =>
      prev.map((p) =>
        p.id === priceId ? { ...p, isSponsored: nextSponsored } : p
      )
    );
    showToast("Destaque patrocinado atualizado no banco.");
  };

  return (
    <AppContext.Provider
      value={{
        categories: CATEGORIES,
        markets,
        products,
        prices,
        shoppingList,
        location,
        user,
        accessToken,
        toast,
        catalogLoading,
        catalogError,
        partnerApplications,
        courierApplications,
        priceReports,
        isLocationModalOpen,
        setIsLocationModalOpen,
        updateLocation,
        refreshCatalog,
        registerExternalProduct,
        addToList,
        removeFromList,
        updateListQuantity,
        toggleListItemChecked,
        clearList,
        saveListToSupabase,
        logoutUser,
        syncSessionFromToken,
        showToast,
        upsertMarketPrice,
        addNewProductWithPrice,
        removeMarketPrice,
        updateMarketProfile,
        submitPartnerApplication,
        submitCourierApplication,
        submitPriceReport,
        updatePartnerApplicationStatus,
        updatePriceReportStatus,
        toggleMarketStatus,
        toggleSponsoredPrice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp deve ser utilizado dentro de um AppProvider");
  }
  return ctx;
}
