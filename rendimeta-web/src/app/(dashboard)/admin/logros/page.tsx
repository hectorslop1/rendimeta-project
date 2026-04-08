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
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Bonos y Logros
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
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
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Codigo
            </label>
            <input
              name="code"
              type="text"
              required
              defaultValue={editRow?.code || ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Icono (emoji)
            </label>
            <input
              name="iconEmoji"
              type="text"
              defaultValue={editRow?.iconEmoji || ""}
              placeholder="Ej: *"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={editRow?.name || ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descripcion
          </label>
          <textarea
            name="description"
            rows={2}
            defaultValue={editRow?.description || ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoria
            </label>
            <select
              name="category"
              required
              defaultValue={editRow?.category || ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Puntos
            </label>
            <input
              name="pointValue"
              type="number"
              required
              min={0}
              defaultValue={editRow?.pointValue ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
