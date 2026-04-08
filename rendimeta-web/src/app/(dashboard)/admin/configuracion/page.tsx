"use client";

import { useEffect, useState } from "react";
import { Loader2, Menu, Palette, Save, Settings2 } from "lucide-react";
import { useSystemConfig } from "@/hooks/use-hr-data";
import { useUpdateSystemConfig } from "@/hooks/use-hr-crud";
import { useAuth } from "@/providers/auth-provider";
import { NavigationConfigPanel } from "@/components/admin/navigation-config-panel";
import { ThemeConfigPanel } from "@/components/admin/theme-config-panel";
import { cn } from "@/lib/utils";

type ConfigTab = "general" | "themes" | "menu";

const CONFIG_TABS: { id: ConfigTab; label: string; icon: typeof Settings2 }[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "themes", label: "Themes", icon: Palette },
  { id: "menu", label: "Menú", icon: Menu },
];

export default function AdminConfiguracionPage() {
  const { hasMinLevel } = useAuth();
  const { data: config, isLoading } = useSystemConfig();
  const updateConfig = useUpdateSystemConfig();

  const [activeTab, setActiveTab] = useState<ConfigTab>("general");
  const [companyName, setCompanyName] = useState("");
  const [companyShortName, setCompanyShortName] = useState("");
  const [brandColor, setBrandColor] = useState("#e11d48");
  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [currency, setCurrency] = useState("MXN");
  const [operatingHoursStart, setOperatingHoursStart] = useState(6);
  const [operatingHoursEnd, setOperatingHoursEnd] = useState(22);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!config) return;
    setCompanyName(config.companyName || "");
    setCompanyShortName(config.companyShortName || "");
    setBrandColor(config.brandColor || "#e11d48");
    setTimezone(config.timezone || "America/Mexico_City");
    setCurrency(config.currency || "MXN");
    setOperatingHoursStart(config.operatingHoursStart ?? 6);
    setOperatingHoursEnd(config.operatingHoursEnd ?? 22);
  }, [config]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(timer);
  }, [saved]);

  if (!hasMinLevel(5)) {
    return (
      <div className="py-12 text-center text-[color:var(--muted-foreground)]">
        No tienes permisos para acceder a esta sección.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--app-primary-strong)]" />
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    try {
      await updateConfig.mutateAsync({
        companyName,
        companyShortName,
        brandColor,
        timezone,
        currency,
        operatingHoursStart,
        operatingHoursEnd,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-soft)]";
  const cardClass =
    "rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-2 shadow-sm">
        {CONFIG_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              data-testid={`config-tab-${tab.id}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--foreground)]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "general" ? (
        <div className={cardClass}>
          <div className="border-b border-[color:var(--app-panel-border)] px-6 py-5">
            <h2 className="text-lg font-bold text-[color:var(--foreground)]">
              Configuración Operativa
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Estos cambios se guardan por API y aplican a la configuración base del sistema.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6 px-6 py-6">
            {error ? (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {saved ? (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                Configuración operativa guardada correctamente.
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Nombre Corto
                </label>
                <input
                  type="text"
                  value={companyShortName}
                  onChange={(e) => setCompanyShortName(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Color de Marca
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-[color:var(--app-panel-border)] bg-transparent"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Zona Horaria
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={inputClass}
                >
                  <option value="America/Mexico_City">America/Mexico_City</option>
                  <option value="America/Tijuana">America/Tijuana</option>
                  <option value="America/Hermosillo">America/Hermosillo</option>
                  <option value="America/Mazatlan">America/Mazatlan</option>
                  <option value="America/Cancun">America/Cancun</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Moneda
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputClass}
                >
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="USD">USD - Dólar Americano</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Hora Inicio Operación
                </label>
                <input
                  type="number"
                  value={operatingHoursStart}
                  onChange={(e) => setOperatingHoursStart(Number(e.target.value))}
                  min={0}
                  max={23}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Hora Fin Operación
                </label>
                <input
                  type="number"
                  value={operatingHoursEnd}
                  onChange={(e) => setOperatingHoursEnd(Number(e.target.value))}
                  min={0}
                  max={23}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateConfig.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--app-primary-strong)] px-5 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar configuración
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {activeTab === "themes" ? (
        <ThemeConfigPanel />
      ) : null}

      {activeTab === "menu" ? (
        <NavigationConfigPanel />
      ) : null}
    </div>
  );
}
