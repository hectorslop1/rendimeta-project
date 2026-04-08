"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/crud/data-table";
import { FormModal } from "@/components/crud/form-modal";
import { StatusBadge } from "@/components/crud/status-badge";
import { SearchInput } from "@/components/crud/search-input";
import { useCategories } from "@/hooks/use-hr-data";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-hr-crud";

interface CategoryRow {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminCategoriasPage() {
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<CategoryRow | null>(null);
  const [formError, setFormError] = useState("");

  const categories: CategoryRow[] = Array.isArray(data) ? data : [];
  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditRow(null);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(row: CategoryRow) {
    setEditRow(row);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(data: Record<string, any>) {
    setFormError("");
    try {
      const payload = {
        name: data.name,
        code: data.code,
        sortOrder: Number(data.sortOrder),
      };
      if (editRow) {
        await updateCategory.mutateAsync({ id: editRow.id, ...payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  const columns = [
    { key: "name", label: "Nombre" },
    { key: "code", label: "Codigo" },
    { key: "sortOrder", label: "Orden" },
    {
      key: "isActive",
      label: "Activo",
      render: (row: CategoryRow) => <StatusBadge active={row.isActive} />,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Categorias
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Categoria
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar categorias..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onEdit={openEdit}
        emptyMessage="No se encontraron categorias"
      />

      <FormModal
        title={editRow ? "Editar Categoria" : "Nueva Categoria"}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={createCategory.isPending || updateCategory.isPending}
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
            Orden
          </label>
          <input
            name="sortOrder"
            type="number"
            required
            min={0}
            defaultValue={editRow?.sortOrder ?? 0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </FormModal>
    </div>
  );
}
