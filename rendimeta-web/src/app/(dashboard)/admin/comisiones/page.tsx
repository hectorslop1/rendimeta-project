"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/crud/data-table";
import { FormModal } from "@/components/crud/form-modal";
import { StatusBadge } from "@/components/crud/status-badge";
import { SearchInput } from "@/components/crud/search-input";
import { useCommissionRules, useCategories } from "@/hooks/use-hr-data";
import { useCreateCommissionRule, useUpdateCommissionRule } from "@/hooks/use-hr-crud";
import type { CommissionRuleRecord } from "@/types/hr";

export default function AdminComisionesPage() {
  const { data: rulesData, isLoading } = useCommissionRules();
  const { data: categoriesData } = useCategories();
  const createRule = useCreateCommissionRule();
  const updateRule = useUpdateCommissionRule();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<CommissionRuleRecord | null>(null);
  const [formError, setFormError] = useState("");

  const rules: CommissionRuleRecord[] = Array.isArray(rulesData) ? rulesData : [];
  const categories: { id: string; name: string }[] = Array.isArray(categoriesData) ? categoriesData : [];

  const filtered = rules.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditRow(null);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(row: CommissionRuleRecord) {
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
        tierMinPct: Number(data.tierMinPct),
        tierMaxPct: data.tierMaxPct ? Number(data.tierMaxPct) : null,
        commissionPct: Number(data.commissionPct),
        commissionFixed: data.commissionFixed ? Number(data.commissionFixed) : null,
      };
      if (editRow) {
        await updateRule.mutateAsync({ id: editRow.id, ...payload });
      } else {
        await createRule.mutateAsync(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  function formatPct(val: number) {
    return `${val}%`;
  }

  function formatCurrency(val: number | null) {
    if (val == null) return "—";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(val);
  }

  const columns = [
    { key: "name", label: "Nombre" },
    {
      key: "category",
      label: "Categoria",
      render: (row: CommissionRuleRecord) => row.category?.name || "—",
    },
    {
      key: "tierMinPct",
      label: "Min%",
      render: (row: CommissionRuleRecord) => formatPct(row.tierMinPct),
    },
    {
      key: "tierMaxPct",
      label: "Max%",
      render: (row: CommissionRuleRecord) =>
        row.tierMaxPct != null ? formatPct(row.tierMaxPct) : "—",
    },
    {
      key: "commissionPct",
      label: "Tasa%",
      render: (row: CommissionRuleRecord) => formatPct(row.commissionPct),
    },
    {
      key: "commissionFixed",
      label: "Monto Fijo",
      render: (row: CommissionRuleRecord) => formatCurrency(row.commissionFixed),
    },
    {
      key: "isActive",
      label: "Activo",
      render: (row: CommissionRuleRecord) => <StatusBadge active={row.isActive} />,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reglas de Comisiones
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Regla
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar reglas..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onEdit={openEdit}
        emptyMessage="No se encontraron reglas de comision"
      />

      <FormModal
        title={editRow ? "Editar Regla" : "Nueva Regla"}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={createRule.isPending || updateRule.isPending}
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cumplimiento Min (%)
            </label>
            <input
              name="tierMinPct"
              type="number"
              required
              step="0.01"
              min={0}
              defaultValue={editRow?.tierMinPct ?? 0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cumplimiento Max (%)
            </label>
            <input
              name="tierMaxPct"
              type="number"
              step="0.01"
              min={0}
              defaultValue={editRow?.tierMaxPct ?? ""}
              placeholder="Sin limite"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tasa Comision (%)
            </label>
            <input
              name="commissionPct"
              type="number"
              required
              step="0.01"
              min={0}
              defaultValue={editRow?.commissionPct ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Monto Fijo
            </label>
            <input
              name="commissionFixed"
              type="number"
              step="0.01"
              min={0}
              defaultValue={editRow?.commissionFixed ?? ""}
              placeholder="Opcional"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
