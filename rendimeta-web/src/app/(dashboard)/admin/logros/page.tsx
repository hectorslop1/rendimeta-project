"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/crud/data-table";
import { FormModal } from "@/components/crud/form-modal";
import { StatusBadge } from "@/components/crud/status-badge";
import { SearchInput } from "@/components/crud/search-input";
import { useAchievements } from "@/hooks/use-hr-data";
import { useCreateAchievement, useUpdateAchievement } from "@/hooks/use-hr-crud";
import type { AchievementDefinitionRecord } from "@/types/hr";

const CATEGORY_OPTIONS = [
  { value: "sales", label: "Ventas" },
  { value: "attendance", label: "Asistencia" },
  { value: "streak", label: "Racha" },
  { value: "milestone", label: "Hito" },
];

export default function AdminLogrosPage() {
  const { data: achievementsData, isLoading } = useAchievements();
  const createAchievement = useCreateAchievement();
  const updateAchievement = useUpdateAchievement();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<AchievementDefinitionRecord | null>(null);
  const [formError, setFormError] = useState("");

  const achievements: AchievementDefinitionRecord[] = Array.isArray(achievementsData)
    ? achievementsData
    : [];

  const filtered = achievements.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditRow(null);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(row: AchievementDefinitionRecord) {
    setEditRow(row);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(data: Record<string, any>) {
    setFormError("");
    try {
      const payload = {
        code: data.code,
        name: data.name,
        description: data.description || "",
        iconEmoji: data.iconEmoji || "",
        category: data.category,
        pointValue: Number(data.pointValue),
      };
      if (editRow) {
        await updateAchievement.mutateAsync({ id: editRow.id, ...payload });
      } else {
        await createAchievement.mutateAsync(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  function getCategoryLabel(cat: string) {
    return CATEGORY_OPTIONS.find((c) => c.value === cat)?.label || cat;
  }

  const columns = [
    { key: "code", label: "Codigo" },
    {
      key: "name",
      label: "Nombre",
      render: (row: AchievementDefinitionRecord) => (
        <span>
          {row.iconEmoji && <span className="mr-1">{row.iconEmoji}</span>}
          {row.name}
        </span>
      ),
    },
    {
      key: "category",
      label: "Categoria",
      render: (row: AchievementDefinitionRecord) => (
        <span className="inline-flex items-center rounded-full bg-[color:var(--app-table-row-alt-bg)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--app-table-row-text)]">
          {getCategoryLabel(row.category)}
        </span>
      ),
    },
    { key: "pointValue", label: "Puntos" },
    {
      key: "isActive",
      label: "Activo",
      render: (row: AchievementDefinitionRecord) => <StatusBadge active={row.isActive} />,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[color:var(--app-title-color)]">
          Bonos y Logros
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Bono
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar logros..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onEdit={openEdit}
        emptyMessage="No se encontraron logros"
      />

      <FormModal
        title={editRow ? "Editar Logro" : "Nuevo Logro"}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={createAchievement.isPending || updateAchievement.isPending}
        error={formError}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[color:var(--app-table-header-text)]">
              Codigo
            </label>
            <input
              name="code"
              type="text"
              required
              defaultValue={editRow?.code || ""}
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-strong)]/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[color:var(--app-table-header-text)]">
              Icono (emoji)
            </label>
            <input
              name="iconEmoji"
              type="text"
              defaultValue={editRow?.iconEmoji || ""}
              placeholder="Ej: *"
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-strong)]/20"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--app-table-header-text)]">
            Nombre
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={editRow?.name || ""}
            className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-strong)]/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--app-table-header-text)]">
            Descripcion
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={editRow?.description || ""}
            className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-strong)]/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[color:var(--app-table-header-text)]">
              Categoria
            </label>
            <select
              name="category"
              required
              defaultValue={editRow?.category || ""}
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-strong)]/20"
            >
              <option value="">Seleccionar...</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[color:var(--app-table-header-text)]">
              Puntos
            </label>
            <input
              name="pointValue"
              type="number"
              required
              min={0}
              defaultValue={editRow?.pointValue ?? ""}
              className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--app-table-row-text)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-strong)]/20"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
