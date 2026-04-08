"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeConfig,
  defaultThemeConfig,
  getStoredThemeConfig,
  saveThemeConfig,
  sanitizeThemeConfig,
  type ThemeConfig,
} from "@/lib/theme-config";
import {
  buildDefaultNavigationConfig,
  sanitizeNavigationConfig,
  type NavigationStatePayload,
  type NavigationConfig,
  type NavigationTemplateSummary,
  type SaveNavigationConfigOptions,
} from "@/lib/navigation";
import { useAuth } from "@/providers/auth-provider";

interface AppShellContextValue {
  hydrated: boolean;
  themeConfig: ThemeConfig;
  setThemeConfig: (theme: ThemeConfig) => void;
  updateThemeConfig: (patch: Partial<ThemeConfig>) => void;
  resetThemeConfig: () => void;
  toggleThemeMode: () => void;
  navigationConfig: NavigationConfig;
  navigationTemplates: NavigationTemplateSummary[];
  activeNavigationTemplateId: string;
  activeNavigationTemplateName: string;
  navigationLoaded: boolean;
  navigationSaving: boolean;
  refreshNavigationConfig: () => Promise<void>;
  activateNavigationTemplate: (templateId: string) => Promise<void>;
  saveNavigationConfig: (
    config: NavigationConfig,
    options?: SaveNavigationConfigOptions
  ) => Promise<NavigationConfig>;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [themeConfig, setThemeConfigState] = useState<ThemeConfig>(() => getStoredThemeConfig());
  const [navigationConfig, setNavigationConfigState] = useState<NavigationConfig>(() =>
    buildDefaultNavigationConfig()
  );
  const [navigationTemplates, setNavigationTemplates] = useState<NavigationTemplateSummary[]>([
    {
      id: "menu-base",
      name: "Menu Base",
      updatedAt: buildDefaultNavigationConfig().updatedAt,
    },
  ]);
  const [activeNavigationTemplateId, setActiveNavigationTemplateId] = useState("menu-base");
  const [navigationLoaded, setNavigationLoaded] = useState(false);
  const [navigationSaving, setNavigationSaving] = useState(false);

  function syncNavigationState(payload: NavigationStatePayload) {
    setNavigationConfigState(sanitizeNavigationConfig(payload.config));
    setNavigationTemplates(payload.templates);
    setActiveNavigationTemplateId(payload.activeTemplateId);
  }

  useEffect(() => {
    applyThemeConfig(themeConfig);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyThemeConfig(themeConfig);
    saveThemeConfig(themeConfig);
  }, [hydrated, themeConfig]);

  useEffect(() => {
    let cancelled = false;

    async function loadNavigationConfig() {
      try {
        const res = await fetch("/api/navigation/config");
        if (!res.ok) throw new Error("navigation-config");
        const data = (await res.json()) as NavigationStatePayload;
        if (!cancelled) {
          syncNavigationState(data);
        }
      } catch {
        if (!cancelled) {
          setNavigationConfigState(buildDefaultNavigationConfig());
          setNavigationTemplates([
            {
              id: "menu-base",
              name: "Menu Base",
              updatedAt: buildDefaultNavigationConfig().updatedAt,
            },
          ]);
          setActiveNavigationTemplateId("menu-base");
        }
      } finally {
        if (!cancelled) {
          setNavigationLoaded(true);
        }
      }
    }

    loadNavigationConfig();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const value = useMemo<AppShellContextValue>(
    () => ({
      hydrated,
      themeConfig,
      setThemeConfig: (theme) => setThemeConfigState(sanitizeThemeConfig(theme)),
      updateThemeConfig: (patch) =>
        setThemeConfigState((current) => sanitizeThemeConfig({ ...current, ...patch })),
      resetThemeConfig: () => setThemeConfigState(defaultThemeConfig),
      toggleThemeMode: () =>
        setThemeConfigState((current) =>
          sanitizeThemeConfig({ ...current, isDarkMode: !current.isDarkMode })
        ),
      navigationConfig,
      navigationTemplates,
      activeNavigationTemplateId,
      activeNavigationTemplateName:
        navigationTemplates.find((template) => template.id === activeNavigationTemplateId)?.name ??
        "Menu Base",
      navigationLoaded,
      navigationSaving,
      refreshNavigationConfig: async () => {
        const res = await fetch("/api/navigation/config");
        if (!res.ok) throw new Error("Error cargando configuración de navegación");
        const data = (await res.json()) as NavigationStatePayload;
        syncNavigationState(data);
      },
      activateNavigationTemplate: async (templateId) => {
        setNavigationSaving(true);
        try {
          const res = await fetch("/api/navigation/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId }),
          });
          if (!res.ok) throw new Error("Error activando template de navegación");
          const data = (await res.json()) as NavigationStatePayload;
          syncNavigationState(data);
        } finally {
          setNavigationSaving(false);
        }
      },
      saveNavigationConfig: async (config, options) => {
        setNavigationSaving(true);
        try {
          const res = await fetch("/api/navigation/config", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ config, options }),
          });
          if (!res.ok) throw new Error("Error guardando configuración de navegación");
          const data = (await res.json()) as NavigationStatePayload;
          const normalized = sanitizeNavigationConfig(data.config);
          syncNavigationState(data);
          return normalized;
        } finally {
          setNavigationSaving(false);
        }
      },
    }),
    [
      activeNavigationTemplateId,
      hydrated,
      navigationConfig,
      navigationLoaded,
      navigationSaving,
      navigationTemplates,
      themeConfig,
    ]
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }
  return context;
}
