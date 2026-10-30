"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
  Product,
} from "@/data/mockData";
import { supabase } from "@/lib/supabase";

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
  // Partner Market actions
  upsertMarketPrice: (
    marketId: string,
    productId: string,
    price: number,
    isPromo: boolean,
    promoLabel?: string,
    inStock?: boolean
  ) => void;
  addNewProductWithPrice: (
    marketId: string,
    product: Omit<Product, "id" | "isDemo">,
    price: number,
    isPromo: boolean,
    promoLabel?: string
  ) => void;
  removeMarketPrice: (marketId: string, productId: string) => void;
  updateMarketProfile: (marketId: string, updates: Partial<Market>) => void;
  // Forms & Admin actions
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
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [prices, setPrices] = useState<MarketPrice[]>(INITIAL_PRICES);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(
    DEFAULT_SHOPPING_LIST
  );
  const [location, setLocation] = useState<LocationConfig>({
    city: "São Paulo",
    neighborhood: "Vila Mariana",
    zipCode: "04101-000",
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
      id: "pa-demo-1",
      marketName: "Mercadinho São Jorge (Demonstração)",
      responsibleName: "Marcos Paulo",
      email: "contato@mercadinhosaojorge.demo.br",
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
      id: "ca-demo-1",
      fullName: "Lucas Ferreira (Demonstração)",
      email: "lucas.entregas@demo.br",
      phone: "(11) 97654-3210",
      vehicleType: "moto",
      serviceNeighborhoods: ["Vila Mariana", "Saúde", "Ipiranga"],
      status: "pre_cadastro",
      createdAt: "Ontem, 16:40",
    },
  ]);

  const [priceReports, setPriceReports] = useState<PriceReport[]>([
    {
      id: "rep-demo-1",
      marketId: "mercado-c",
      productId: "cafe-torrado-500g",
      reason: "Preço desatualizado há mais de 5 dias",
      details: "Verificação automática de atualização pendente no catálogo demonstrativo.",
      status: "pendente",
      createdAt: "Hoje, 08:00",
    },
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Load persisted list and location from session/localStorage & check Supabase Auth
  useEffect(() => {
    try {
      const savedList = localStorage.getItem("economize_shopping_list");
      if (savedList) {
        setShoppingList(JSON.parse(savedList));
      }
      const savedLoc = localStorage.getItem("economize_location");
      if (savedLoc) {
        setLocation(JSON.parse(savedLoc));
      }
      const savedDemoUser = localStorage.getItem("economize_demo_user");
      if (savedDemoUser) {
        setUser(JSON.parse(savedDemoUser));
      }
    } catch {
      // Ignore storage access errors
    }

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
      // Ignore
    }
  }, [shoppingList]);

  const updateLocation = (loc: Partial<LocationConfig>) => {
    setLocation((prev) => {
      const updated = { ...prev, ...loc };
      try {
        localStorage.setItem("economize_location", JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
    showToast("Localização atualizada com sucesso!");
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
    showToast("Lista limpa. Você pode restaurar a lista de exemplo quando quiser.");
  };

  const restoreDefaultList = () => {
    setShoppingList(DEFAULT_SHOPPING_LIST);
    showToast("Lista demonstrativa restaurada!");
  };

  const saveListToSupabase = async () => {
    if (!user) {
      showToast("Entre na sua conta para salvar listas na nuvem.");
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
        showToast("Lista salva com segurança no banco de dados Supabase!");
      } else {
        showToast(
          "Lista salva localmente na sua conta (execute o schema.sql no Supabase para persistência na nuvem)."
        );
      }
    } catch {
      showToast("Lista salva localmente na sessão do navegador.");
    }
  };

  const loginDemoRole = (role: UserRole) => {
    const roleLabels: Record<UserRole, { name: string; email: string }> = {
      consumidor: {
        name: "Ana Paula (Consumidora Demo)",
        email: "consumidor@economize.demo.br",
      },
      mercado: {
        name: "Carlos Mendes (Mercado Exemplo A)",
        email: "parceiro@mercadoexemploa.demo.br",
      },
      entregador: {
        name: "Lucas Ferreira (Entregador Demo)",
        email: "entregador@economize.demo.br",
      },
      admin: {
        name: "Equipe Economize+ (Admin Demo)",
        email: "admin@economize.demo.br",
      },
    };
    const demoUser: UserProfile = {
      id: `demo-${role}`,
      name: roleLabels[role].name,
      email: roleLabels[role].email,
      role,
      marketId: "mercado-a",
      isDemoAuth: true,
    };
    setUser(demoUser);
    try {
      localStorage.setItem("economize_demo_user", JSON.stringify(demoUser));
    } catch {
      // Ignore
    }
    showToast(`Acesso demonstrativo ativado como: ${role.toUpperCase()}`);
  };

  const logoutUser = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    try {
      localStorage.removeItem("economize_demo_user");
    } catch {
      // Ignore
    }
    showToast("Você saiu da sua conta.");
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
    inStock = true
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
                needsUpdateAlert: false,
                updatedAt: "Agora mesmo",
              }
            : p
        );
      }
      return [
        ...prev,
        {
          id: `p-${Date.now()}`,
          marketId,
          productId,
          price,
          isPromo,
          promoLabel: isPromo ? promoLabel || "Oferta" : undefined,
          inStock,
          updatedAt: "Agora mesmo",
        },
      ];
    });
    setMarkets((prev) =>
      prev.map((m) =>
        m.id === marketId ? { ...m, lastCatalogUpdate: "Agora mesmo" } : m
      )
    );
    showToast("Preço atualizado e registrado no histórico!");
  };

  const addNewProductWithPrice = (
    marketId: string,
    product: Omit<Product, "id" | "isDemo">,
    price: number,
    isPromo: boolean,
    promoLabel?: string
  ) => {
    const newId = `prod-${Date.now()}`;
    const newProd: Product = {
      ...product,
      id: newId,
      isDemo: true,
    };
    setProducts((prev) => [newProd, ...prev]);
    setPrices((prev) => [
      {
        id: `price-${Date.now()}`,
        marketId,
        productId: newId,
        price,
        isPromo,
        promoLabel: isPromo ? promoLabel || "Oferta" : undefined,
        inStock: true,
        updatedAt: "Agora mesmo",
      },
      ...prev,
    ]);
    showToast(`Produto "${product.name}" cadastrado no catálogo!`);
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
    setMarkets((prev) =>
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
      // Fallback to local state if table not migrated yet
    }
    showToast(
      "Solicitação de parceria enviada! Nossa equipe analisará os dados."
    );
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
      // Fallback to local state
    }
    showToast("Pré-cadastro de entregador registrado para a futura operação!");
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
        market_id: marketId,
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
    showToast(`Denúncia marcada como: ${status}`);
  };

  const toggleMarketStatus = (marketId: string) => {
    setMarkets((prev) =>
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
