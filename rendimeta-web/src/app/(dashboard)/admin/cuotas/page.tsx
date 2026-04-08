"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/crud/data-table";
import { FormModal } from "@/components/crud/form-modal";
import { StatusBadge } from "@/components/crud/status-badge";
import { SearchInput } from "@/components/crud/search-input";
import { useQuotaTemplates, useCategories } from "@/hooks/use-hr-data";
import { useCreateQuotaTemplate, useUpdateQuotaTemplate } from "@/hooks/use-hr-crud";
import { useStations } from "@/hooks/use-kpi-data";
import type { QuotaTemplateRecord } from "@/types/hr";

export default function AdminCuotasPage() {
  const { data: templatesData, isLoading } = useQuotaTemplates();
  const { data: categoriesData } = useCategories();
  const { data: stationsData } = useStations();
  const createTemplate = useCreateQuotaTemplate();
  const updateTemplate = useUpdateQuotaTemplate();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<QuotaTemplateRecord | null>(null);
  const [formError, setFormError] = useState("");

  const templates: QuotaTemplateRecord[] = Array.isArray(templatesData) ? templatesData : [];
  const categories: { id: string; name: string }[] = Array.isArray(categoriesData) ? categoriesData : [];
  const stations: { id: string; name: string }[] = Array.isArray(stationsData) ? stationsData : [];

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditRow(null);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(row: QuotaTemplateRecord) {
    setEditRow(row);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(data: Record<string, any>) {
    setFormError("");
    try {
      const payload = {
        name: data.name,
        categoryId: data.categoryId,
        stationId: data.stationId || null,
        monthlyTarget: Number(data.monthlyTarget),
        isRevenue: data.isRevenue === "on" || data.isRevenue === "true",
      };
      if (editRow) {
        await updateTemplate.mutateAsync({ id: editRow.id, ...payload });
      } else {
        await createTemplate.mutateAsync(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  function formatNumber(val: number) {
    return new Intl.NumberFormat("es-MX").format(val);
  }

  const columns = [
    { key: "name", label: "Nombre" },
    {
      key: "category",
      label: "Categoria",
      render: (row: QuotaTemplateRecord) => row.category?.name || "—",
    },
    {
      key: "station",
      label: "Estacion",
      render: (row: QuotaTemplateRecord) => row.station?.name || "Todas",
    },
    {
      key: "monthlyTarget",
      label: "Meta Mensual",
      render: (row: QuotaTemplateRecord) => formatNumber(row.monthlyTarget),
    },
    {
      key: "isRevenue",
      label: "Es Ingreso",
      render: (row: QuotaTemplateRecord) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            row.isRevenue
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {row.isRevenue ? "Si" : "No"}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Activo",
      render: (row: QuotaTemplateRecord) => <StatusBadge active={row.isActive} />,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Plantillas de Cuotas
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Plantilla
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar plantillas..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onEdit={openEdit}
        emptyMessage="No se encontraron plantillas de cuotas"
      />

      <FormModal
        title={editRow ? "Editar Plantilla" : "Nueva Plantilla"}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={createTemplate.isPending || updateTemplate.isPending}
        error={formError}
      >
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
            Categoria
          </label>
          <select
            name="categoryId"
            required
            defaultValue={editRow?.category?.id || ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccionar categoria...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Estacion (opcional)
          </label>
          <select
            name="stationId"
            defaultValue={editRow?.station?.id || ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Todas las estaciones</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Meta Mensual
          </label>
          <input
            name="monthlyTarget"
            type="number"
            required
            step="0.01"
            min={0}
            defaultValue={editRow?.monthlyTarget ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            name="isRevenue"
            type="checkbox"
            defaultChecked={editRow?.isRevenue ?? false}
            className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 dark:border-gray-600"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Es Ingreso
          </label>
        </div>
      </FormModal>
    </div>
  );
}
