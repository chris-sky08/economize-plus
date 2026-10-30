"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  Category,
  CourierApplication,
  DEFAULT_SHOPPING_LIST,
  INITIAL_MARKETS,
  INITIAL_PRICES,
  INITIAL_PRODUCTS,
  Market,
  MarketPrice,
  PartnerApplication,
  PriceReport,
  PriceSource,
  Product,
} from "@/data/mockData";
import {
  fetchCatalogFromSupabase,
  saveProductToSupabase,
  supabase,
} from "@/lib/supabase";
import { calculateHaversineKm } from "@/hooks/useUserLocation";

export type UserRole = "consumidor" | "mercado" | "entregador" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  marketId?: string;
  isDemoAuth?: boolean;
}

export interface ShoppingListItem {
  productId: string;
  quantity: number;
  checked: boolean;
}

export interface LocationConfig {
  city: string;
  neighborhood: string;
  zipCode: string;
  lat: number;
  lng: number;
  maxRadiusKm: number;
  deviceLocationGranted: boolean;
}

interface AppContextType {
  categories: Category[];
  markets: Market[];
  products: Product[];
  prices: MarketPrice[];
  shoppingList: ShoppingListItem[];
  location: LocationConfig;
  user: UserProfile | null;
  toast: string | null;
  partnerApplications: PartnerApplication[];
  courierApplications: CourierApplication[];
  priceReports: PriceReport[];
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  updateLocation: (loc: Partial<LocationConfig>) => void;
  registerExternalProduct: (product: Product) => Promise<void>;
  addToList: (productId: string, qty?: number) => void;
  removeFromList: (productId: string) => void;
  updateListQuantity: (productId: string, qty: number) => void;
  toggleListItemChecked: (productId: string) => void;
  clearList: () => void;
  restoreDefaultList: () => void;
  saveListToSupabase: () => Promise<void>;
  loginDemoRole: (role: UserRole) => void;
  logoutUser: () => Promise<void>;
  setAuthUser: (u: UserProfile | null) => void;
  showToast: (msg: string) => void;
  upsertMarketPrice: (
    marketId: string,
    productId: string,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    inStock?: boolean,
    source?: PriceSource
  ) => void;
  addNewProductWithPrice: (
    marketId: string,
    product: Omit<Product, "id">,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    source?: PriceSource
  ) => void;
  removeMarketPrice: (marketId: string, productId: string) => void;
  updateMarketProfile: (marketId: string, updates: Partial<Market>) => void;
  submitPartnerApplication: (
    app: Omit<PartnerApplication, "id" | "status" | "createdAt">
  ) => Promise<void>;
  submitCourierApplication: (
    app: Omit<CourierApplication, "id" | "status" | "createdAt">
  ) => Promise<void>;
  submitPriceReport: (
    marketId: string,
    productId: string,
    reason: string,
    details: string
  ) => Promise<void>;
  updatePartnerApplicationStatus: (
    id: string,
    status: "em_analise" | "aprovado" | "recusado"
  ) => void;
  updatePriceReportStatus: (
    id: string,
    status: "pendente" | "revisado" | "arquivado"
  ) => void;
  toggleMarketStatus: (marketId: string) => void;
  toggleSponsoredPrice: (priceId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rawMarkets, setRawMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [prices, setPrices] = useState<MarketPrice[]>(INITIAL_PRICES);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(
    DEFAULT_SHOPPING_LIST
  );
  const [location, setLocation] = useState<LocationConfig>({
    city: "São Paulo",
    neighborhood: "Vila Mariana",
    zipCode: "04101-000",
    lat: -23.5842,
    lng: -46.6365,
    maxRadiusKm: 5,
    deviceLocationGranted: false,
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [partnerApplications, setPartnerApplications] = useState<
    PartnerApplication[]
  >([
    {
      id: "pa-1",
      marketName: "Mercadinho São Jorge",
      responsibleName: "Marcos Paulo",
      email: "contato@mercadinhosaojorge.com.br",
      phone: "(11) 98765-4321",
      address: "Rua Loefgren, 1120",
      neighborhood: "Vila Clementino",
      city: "São Paulo",
      zipCode: "04040-000",
      desiredPlan: "premium",
      status: "em_analise",
      createdAt: "Hoje, 10:15",
    },
  ]);

  const [courierApplications, setCourierApplications] = useState<
    CourierApplication[]
  >([
    {
      id: "ca-1",
      fullName: "Lucas Ferreira",
      email: "lucas.entregas@economizemais.com.br",
      phone: "(11) 97654-3210",
      vehicleType: "moto",
      serviceNeighborhoods: ["Vila Mariana", "Saúde", "Ipiranga"],
      status: "pre_cadastro",
      createdAt: "Ontem, 16:40",
    },
  ]);

  const [priceReports, setPriceReports] = useState<PriceReport[]>([
    {
      id: "rep-1",
      marketId: "mercado-c",
      productId: "cafe-torrado-500g",
      reason: "Preço com atualização pendente há mais de 5 dias",
      details: "Verificação automática de revisão de preço no catálogo.",
      status: "pendente",
      createdAt: "Hoje, 08:00",
    },
  ]);

  // Recalcula a distância real de cada supermercado usando a Fórmula de Haversine
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  useEffect(() => {
    try {
      const savedList = localStorage.getItem("economize_shopping_list");
      if (savedList) {
        setShoppingList(JSON.parse(savedList));
      }
      const savedLoc = localStorage.getItem("economize_location");
      if (savedLoc) {
        const parsed = JSON.parse(savedLoc) as Partial<LocationConfig>;
        setLocation((prev) => ({
          ...prev,
          ...parsed,
          lat: typeof parsed.lat === "number" ? parsed.lat : prev.lat,
          lng: typeof parsed.lng === "number" ? parsed.lng : prev.lng,
        }));
      }
      const savedUser = localStorage.getItem("economize_demo_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // Ignora erro de localStorage
    }

    // Busca catálogo real do Supabase (com fallback seguro)
    fetchCatalogFromSupabase().then((remote) => {
      if (remote.supermarkets && remote.supermarkets.length > 0) {
        setRawMarkets(remote.supermarkets);
      }
      if (remote.products && remote.products.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          remote.products!.forEach((rp) => {
            if (!existingIds.has(rp.id)) merged.push(rp);
          });
          return merged;
        });
      }
      if (remote.prices && remote.prices.length > 0) {
        setPrices((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          remote.prices!.forEach((rpr) => {
            if (!existingIds.has(rpr.id)) merged.push(rpr);
          });
          return merged;
        });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const sbUser = data.session.user;
        setUser({
          id: sbUser.id,
          name:
            sbUser.user_metadata?.full_name ||
            sbUser.email?.split("@")[0] ||
            "Usuário Economize+",
          email: sbUser.email || "",
          role: (sbUser.user_metadata?.role as UserRole) || "consumidor",
          marketId: "mercado-a",
          isDemoAuth: false,
        });
      }
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "economize_shopping_list",
        JSON.stringify(shoppingList)
      );
    } catch {
      // Ignora
    }
  }, [shoppingList]);

  const updateLocation = (loc: Partial<LocationConfig>) => {
    setLocation((prev) => {
      const updated = { ...prev, ...loc };
      try {
        localStorage.setItem("economize_location", JSON.stringify(updated));
      } catch {
        // Ignora
      }
      return updated;
    });
    showToast("Localização e distâncias (Haversine) atualizadas!");
  };

  const registerExternalProduct = async (product: Product) => {
    setProducts((prev) => {
      if (prev.some((p) => p.id === product.id || p.ean === product.ean)) {
        return prev;
      }
      return [product, ...prev];
    });
    await saveProductToSupabase(product);
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
    showToast("Lista limpa.");
  };

  const restoreDefaultList = () => {
    setShoppingList(DEFAULT_SHOPPING_LIST);
    showToast("Lista padrão restaurada!");
  };

  const saveListToSupabase = async () => {
    if (!user) {
      showToast("Lista mantida no seu navegador. Entre na conta para sincronizar na nuvem.");
      return;
    }
    try {
      const { data: listData, error } = await supabase
        .from("shopping_lists")
        .insert({
          user_id: user.id,
          title: "Minha Lista Economize+",
        })
        .select()
        .single();

      if (!error && listData) {
        await supabase.from("shopping_list_items").insert(
          shoppingList.map((item) => ({
            list_id: listData.id,
            product_id: item.productId,
            quantity: item.quantity,
            checked: item.checked,
          }))
        );
        showToast("Lista sincronizada com sucesso no Supabase!");
      } else {
        showToast("Lista salva localmente na sua sessão.");
      }
    } catch {
      showToast("Lista salva localmente no dispositivo.");
    }
  };

  const loginDemoRole = (role: UserRole) => {
    const roleLabels: Record<UserRole, { name: string; email: string }> = {
      consumidor: {
        name: "Ana Paula (Consumidora)",
        email: "consumidor@economizemais.com.br",
      },
      mercado: {
        name: "Carlos Mendes (Super Vila Mariana)",
        email: "parceiro@supervilamariana.com.br",
      },
      entregador: {
        name: "Lucas Ferreira (Entregador Parceiro)",
        email: "entregador@economizemais.com.br",
      },
      admin: {
        name: "Equipe Economize+ (Admin)",
        email: "admin@economizemais.com.br",
      },
    };
    const activeUser: UserProfile = {
      id: `user-${role}`,
      name: roleLabels[role].name,
      email: roleLabels[role].email,
      role,
      marketId: "mercado-a",
      isDemoAuth: true,
    };
    setUser(activeUser);
    try {
      localStorage.setItem("economize_demo_user", JSON.stringify(activeUser));
    } catch {
      // Ignora
    }
    showToast(`Perfil ativo alterado para: ${role.toUpperCase()}`);
  };

  const logoutUser = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    try {
      localStorage.removeItem("economize_demo_user");
    } catch {
      // Ignora
    }
    showToast("Sessão encerrada.");
  };

  const setAuthUser = (u: UserProfile | null) => {
    setUser(u);
  };

  const upsertMarketPrice = (
    marketId: string,
    productId: string,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    inStock = true,
    source: PriceSource = "partner_csv"
  ) => {
    setPrices((prev) => {
      const existing = prev.find(
        (p) => p.marketId === marketId && p.productId === productId
      );
      if (existing) {
        return prev.map((p) =>
          p.marketId === marketId && p.productId === productId
            ? {
                ...p,
                regularPrice: isPromo ? p.price : undefined,
                price,
                isPromo,
                promoLabel: isPromo ? promoLabel || "Oferta" : undefined,
                inStock,
                source,
                needsUpdateAlert: false,
                updatedAt: "Agora mesmo",
              }
            : p
        );
      }
      return [
        ...prev,
        {
          id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          marketId,
          productId,
          price,
          isPromo,
          promoLabel: isPromo ? promoLabel || "Oferta" : undefined,
          inStock,
          source,
          updatedAt: "Agora mesmo",
        },
      ];
    });
    setRawMarkets((prev) =>
      prev.map((m) =>
        m.id === marketId ? { ...m, lastCatalogUpdate: "Agora mesmo" } : m
      )
    );

    supabase
      .from("market_prices")
      .upsert(
        {
          supermarket_id: marketId,
          product_id: productId,
          price,
          is_promo: isPromo,
          promo_label: isPromo ? promoLabel || "Oferta" : null,
          in_stock: inStock,
          source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "supermarket_id,product_id" }
      )
      .then(() => {});

    showToast("Preço atualizado e sincronizado!");
  };

  const addNewProductWithPrice = (
    marketId: string,
    product: Omit<Product, "id">,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    source: PriceSource = "partner_csv"
  ) => {
    const newId = product.ean
      ? `ean-${product.ean}`
      : `prod-${Date.now()}`;
    const newProd: Product = {
      ...product,
      id: newId,
    };
    setProducts((prev) => {
      const exists = prev.some(
        (p) => p.id === newId || (product.ean && p.ean === product.ean)
      );
      return exists ? prev : [newProd, ...prev];
    });
    saveProductToSupabase(newProd).catch(() => {});
    upsertMarketPrice(
      marketId,
      newId,
      price,
      isPromo,
      promoLabel,
      true,
      source
    );
  };

  const removeMarketPrice = (marketId: string, productId: string) => {
    setPrices((prev) =>
      prev.filter(
        (p) => !(p.marketId === marketId && p.productId === productId)
      )
    );
    showToast("Produto removido do catálogo deste mercado.");
  };

  const updateMarketProfile = (marketId: string, updates: Partial<Market>) => {
    setRawMarkets((prev) =>
      prev.map((m) =>
        m.id === marketId
          ? { ...m, ...updates, lastCatalogUpdate: "Agora mesmo" }
          : m
      )
    );
    showToast("Perfil do estabelecimento atualizado!");
  };

  const submitPartnerApplication = async (
    app: Omit<PartnerApplication, "id" | "status" | "createdAt">
  ) => {
    const newApp: PartnerApplication = {
      ...app,
      id: `pa-${Date.now()}`,
      status: "em_analise",
      createdAt: "Agora mesmo",
    };
    setPartnerApplications((prev) => [newApp, ...prev]);
    try {
      await supabase.from("partner_applications").insert({
        market_name: app.marketName,
        responsible_name: app.responsibleName,
        email: app.email,
        phone: app.phone,
        address: app.address,
        neighborhood: app.neighborhood,
        city: app.city,
        zip_code: app.zipCode,
        desired_plan: app.desiredPlan,
      });
    } catch {
      // Fallback
    }
    showToast("Solicitação de parceria enviada com sucesso!");
  };

  const submitCourierApplication = async (
    app: Omit<CourierApplication, "id" | "status" | "createdAt">
  ) => {
    const newCourier: CourierApplication = {
      ...app,
      id: `ca-${Date.now()}`,
      status: "pre_cadastro",
      createdAt: "Agora mesmo",
    };
    setCourierApplications((prev) => [newCourier, ...prev]);
    try {
      await supabase.from("couriers").insert({
        full_name: app.fullName,
        email: app.email,
        phone: app.phone,
        vehicle_type: app.vehicleType,
        service_neighborhoods: app.serviceNeighborhoods,
      });
    } catch {
      // Fallback
    }
    showToast("Pré-cadastro de entregador registrado!");
  };

  const submitPriceReport = async (
    marketId: string,
    productId: string,
    reason: string,
    details: string
  ) => {
    const newReport: PriceReport = {
      id: `rep-${Date.now()}`,
      marketId,
      productId,
      reason,
      details,
      status: "pendente",
      createdAt: "Agora mesmo",
    };
    setPriceReports((prev) => [newReport, ...prev]);
    try {
      await supabase.from("price_reports").insert({
        supermarket_id: marketId,
        product_id: productId,
        reason,
        details,
      });
    } catch {
      // Fallback
    }
    showToast("Relato enviado para revisão no Painel Administrativo.");
  };

  const updatePartnerApplicationStatus = (
    id: string,
    status: "em_analise" | "aprovado" | "recusado"
  ) => {
    setPartnerApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    showToast(`Status da solicitação alterado para: ${status.toUpperCase()}`);
  };

  const updatePriceReportStatus = (
    id: string,
    status: "pendente" | "revisado" | "arquivado"
  ) => {
    setPriceReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    showToast(`Relato marcado como: ${status}`);
  };

  const toggleMarketStatus = (marketId: string) => {
    setRawMarkets((prev) =>
      prev.map((m) =>
        m.id === marketId
          ? { ...m, status: m.status === "ativo" ? "suspenso" : "ativo" }
          : m
      )
    );
    showToast("Status de exibição do mercado atualizado.");
  };

  const toggleSponsoredPrice = (priceId: string) => {
    setPrices((prev) =>
      prev.map((p) =>
        p.id === priceId ? { ...p, isSponsored: !p.isSponsored } : p
      )
    );
    showToast("Destaque patrocinado atualizado.");
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
        toast,
        partnerApplications,
        courierApplications,
        priceReports,
        isLocationModalOpen,
        setIsLocationModalOpen,
        updateLocation,
        registerExternalProduct,
        addToList,
        removeFromList,
        updateListQuantity,
        toggleListItemChecked,
        clearList,
        restoreDefaultList,
        saveListToSupabase,
        loginDemoRole,
        logoutUser,
        setAuthUser,
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
