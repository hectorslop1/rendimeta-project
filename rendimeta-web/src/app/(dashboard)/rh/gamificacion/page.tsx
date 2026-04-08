"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useGamificationScores,
  useAchievements,
} from "@/hooks/use-hr-data";
import { useCreateAchievement } from "@/hooks/use-hr-crud";
import { FormModal } from "@/components/crud/form-modal";
import {
  Loader2,
  Gamepad2,
  LayoutGrid,
  List,
  Trophy,
  Flame,
  ChevronRight,
  Star,
  Plus,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  sales: { label: "Ventas", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  streak: { label: "Racha", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  attendance: { label: "Asistencia", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  performance: { label: "Desempeno", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  social: { label: "Social", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
};

export default function GamificacionPage() {
  const [activeTab, setActiveTab] = useState<"employees" | "catalog">("employees");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const { data: scores, isLoading: isLoadingScores } = useGamificationScores();
  const { data: achievements, isLoading: isLoadingAch } = useAchievements();
  const createMutation = useCreateAchievement();

  const scoresArr = useMemo(
    () => (Array.isArray(scores) ? scores : []),
    [scores]
  );
  const achievementsArr = useMemo(
    () => (Array.isArray(achievements) ? achievements : []),
    [achievements]
  );

  // Filter scores by search
  const filtered = useMemo(() => {
    if (!search.trim()) return scoresArr;
    const q = search.toLowerCase();
    return scoresArr.filter((s: any) => {
      const name = `${s.employee?.firstName ?? ""} ${s.employee?.lastName ?? ""}`.toLowerCase();
      return name.includes(q) || (s.employee?.employeeNumber ?? "").toLowerCase().includes(q);
    });
  }, [scoresArr, search]);

  // Sort achievements by category then points
  const catalogSorted = useMemo(() => {
    return [...achievementsArr].sort((a: any, b: any) => {
      if (a.category !== b.category) return (a.category ?? "").localeCompare(b.category ?? "");
      return (b.pointValue ?? 0) - (a.pointValue ?? 0);
    });
  }, [achievementsArr]);

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      active
        ? "border-[color:var(--app-primary-strong)] text-[color:var(--app-primary-strong)]"
        : "border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--app-table-row-text)]"
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--app-title-color)]">
            Gamificacion
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Puntos, logros y rachas de empleados
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[color:var(--app-panel-border)]">
        <button onClick={() => setActiveTab("employees")} className={tabClass(activeTab === "employees")}>
          <span className="inline-flex items-center gap-1.5">
            <Gamepad2 className="h-4 w-4" />
            Empleados
          </span>
        </button>
        <button onClick={() => setActiveTab("catalog")} className={tabClass(activeTab === "catalog")}>
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="h-4 w-4" />
            Catalogo de Logros
          </span>
        </button>
      </div>

      {/* ===== EMPLOYEES TAB ===== */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar empleado..."
                className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-strong)]/20"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm font-medium text-[color:var(--app-table-row-text)] hover:bg-[color:var(--app-table-row-hover-bg)]"
              title={viewMode === "table" ? "Vista tarjetas" : "Vista tabla"}
            >
              {viewMode === "table" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
          </div>

          {isLoadingScores ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[color:var(--app-primary-strong)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--app-panel-border)] py-16 text-[color:var(--muted-foreground)]">
              <Gamepad2 className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm font-medium">No se encontraron empleados con datos de gamificacion</p>
            </div>
          ) : viewMode === "table" ? (
            /* TABLE VIEW */
            <div className="overflow-x-auto rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)]">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--app-table-header-bg)]">
                  <tr>
                    {["#", "Empleado", "Puntos", "Ventas", "Racha", "Rango", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[color:var(--app-table-header-text)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y [--tw-divide-opacity:1] divide-[color:var(--app-panel-border)]">
                  {filtered.map((s: any, idx: number) => (
                    <tr
                      key={s.id}
                      className="hover:bg-[color:var(--app-table-row-hover-bg)]"
                      style={{ backgroundColor: idx % 2 === 0 ? "var(--app-table-row-bg)" : "var(--app-table-row-alt-bg)" }}
                    >
                      <td className="px-4 py-2.5 text-[color:var(--muted-foreground)]">{idx + 1}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                            {s.employee?.firstName?.[0]}{s.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-[color:var(--app-table-row-text)]">
                              {s.employee?.firstName} {s.employee?.lastName}
                            </p>
                            <p className="text-[11px] text-[color:var(--muted-foreground)]">
                              #{s.employee?.employeeNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[color:var(--app-primary-strong)]">
                        {(s.totalPoints ?? 0).toLocaleString("es-MX")}
                      </td>
                      <td className="px-4 py-2.5 text-[color:var(--app-table-row-text)]">
                        {(s.salesPoints ?? 0).toLocaleString("es-MX")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-medium text-[color:var(--app-table-row-text)]">{s.currentStreak ?? 0}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[color:var(--app-table-row-text)]">
                        {s.rank ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/rh/gamificacion/${s.employee?.id}`}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[color:var(--app-primary-strong)] hover:bg-[color:var(--app-table-row-hover-bg)]"
                        >
                          <Gamepad2 className="h-3.5 w-3.5" />
                          Ver logros
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARD VIEW */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((s: any) => (
                <div
                  key={s.id}
                  className="group rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      {s.employee?.firstName?.[0]}{s.employee?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-[color:var(--app-title-color)]">
                        {s.employee?.firstName} {s.employee?.lastName}
                      </p>
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        #{s.employee?.employeeNumber}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[color:var(--app-primary-strong)]">
                        {(s.totalPoints ?? 0).toLocaleString("es-MX")}
                      </p>
                      <p className="text-[10px] text-[color:var(--muted-foreground)]">Puntos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {s.currentStreak ?? 0}
                      </p>
                      <p className="text-[10px] text-[color:var(--muted-foreground)]">Racha</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-[color:var(--app-table-row-text)]">
                        {(s.salesPoints ?? 0).toLocaleString("es-MX")}
                      </p>
                      <p className="text-[10px] text-[color:var(--muted-foreground)]">Ventas</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/rh/gamificacion/${s.employee?.id}`}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[color:var(--app-primary-strong)] hover:bg-[color:var(--app-table-row-hover-bg)]"
                    >
                      <Gamepad2 className="h-3.5 w-3.5" />
                      Ver logros
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== CATALOG TAB ===== */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[color:var(--muted-foreground)]">
              {catalogSorted.length} logros disponibles que los vendedores pueden desbloquear
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nuevo Logro
            </button>
          </div>

          {isLoadingAch ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[color:var(--app-primary-strong)]" />
            </div>
          ) : catalogSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--app-panel-border)] py-16 text-[color:var(--muted-foreground)]">
              <Trophy className="mb-3 h-12 w-12 opacity-40" />
              <p className="text-sm font-medium">No hay logros definidos</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Crear primer logro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalogSorted.map((ach: any) => {
                const cat = CATEGORY_LABELS[ach.category] ?? { label: ach.category, color: "bg-gray-100 text-gray-700" };
                return (
                  <div
                    key={ach.id}
                    className="relative flex gap-4 rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5 transition-shadow hover:shadow-sm"
                  >
                    {/* Emoji */}
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--app-table-row-alt-bg)] text-3xl">
                      {ach.iconEmoji}
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-[color:var(--app-title-color)]">
                          {ach.name}
                        </p>
                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                          <Star className="h-3 w-3" />
                          {ach.pointValue}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                        {ach.description}
                      </p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.color}`}>
                          {cat.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Achievement Modal */}
      <FormModal
        title="Nuevo Logro"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (formData) => {
          await createMutation.mutateAsync({
            code: formData.code,
            name: formData.name,
            description: formData.description,
            iconEmoji: formData.iconEmoji || "🏆",
            category: formData.category,
            pointValue: parseInt(formData.pointValue) || 10,
            condition: {},
          });
          setModalOpen(false);
        }}
        loading={createMutation.isPending}
        error={(createMutation.error as Error)?.message}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-[color:var(--app-table-header-text)]">
              Nombre
            </label>
            <input
              name="name"
              required
              placeholder="Ej: Vendedor Estrella"
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[color:var(--app-table-header-text)]">
              Codigo
            </label>
            <input
              name="code"
              required
              placeholder="Ej: star_seller"
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[color:var(--app-table-header-text)]">
              Icono (emoji)
            </label>
            <input
              name="iconEmoji"
              defaultValue="🏆"
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)]"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-[color:var(--app-table-header-text)]">
              Descripcion
            </label>
            <input
              name="description"
              required
              placeholder="Ej: Alcanza 100 ventas en un mes"
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[color:var(--app-table-header-text)]">
              Categoria
            </label>
            <select
              name="category"
              required
              defaultValue="sales"
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)]"
            >
              <option value="sales">Ventas</option>
              <option value="streak">Racha</option>
              <option value="attendance">Asistencia</option>
              <option value="performance">Desempeno</option>
              <option value="social">Social</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[color:var(--app-table-header-text)]">
              Puntos
            </label>
            <input
              name="pointValue"
              type="number"
              min="1"
              defaultValue="10"
              required
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)]"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
