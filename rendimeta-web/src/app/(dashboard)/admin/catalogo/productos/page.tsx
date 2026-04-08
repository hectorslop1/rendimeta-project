"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/crud/data-table";
import { FormModal } from "@/components/crud/form-modal";
import { StatusBadge } from "@/components/crud/status-badge";
import { SearchInput } from "@/components/crud/search-input";
import { useProducts, useCategories } from "@/hooks/use-hr-data";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-hr-crud";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  category: { id: string; name: string };
  unitPrice: number;
  costPrice: number;
  unit: string;
  isActive: boolean;
}

const UNIT_OPTIONS = [
  { value: "pieza", label: "Pieza" },
  { value: "litro", label: "Litro" },
  { value: "paquete", label: "Paquete" },
];

export default function AdminProductosPage() {
  const { data: productsData, isLoading } = useProducts();
  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<ProductRow | null>(null);
  const [formError, setFormError] = useState("");

  const products: ProductRow[] = Array.isArray(productsData) ? productsData : [];
  const categories: CategoryOption[] = Array.isArray(categoriesData) ? categoriesData : [];

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditRow(null);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(row: ProductRow) {
    setEditRow(row);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(data: Record<string, any>) {
    setFormError("");
    try {
      const payload = {
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        unitPrice: Number(data.unitPrice),
        costPrice: Number(data.costPrice),
        unit: data.unit,
      };
      if (editRow) {
        await updateProduct.mutateAsync({ id: editRow.id, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  function formatCurrency(val: number) {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(val);
  }

  const columns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Nombre" },
    {
      key: "category",
      label: "Categoria",
      render: (row: ProductRow) => row.category?.name || "—",
    },
    {
      key: "unitPrice",
      label: "Precio",
      render: (row: ProductRow) => formatCurrency(row.unitPrice),
    },
    {
      key: "costPrice",
      label: "Costo",
      render: (row: ProductRow) => formatCurrency(row.costPrice),
    },
    { key: "unit", label: "Unidad" },
    {
      key: "isActive",
      label: "Activo",
      render: (row: ProductRow) => <StatusBadge active={row.isActive} />,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Productos
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por SKU o nombre..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onEdit={openEdit}
        emptyMessage="No se encontraron productos"
      />

      <FormModal
        title={editRow ? "Editar Producto" : "Nuevo Producto"}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={createProduct.isPending || updateProduct.isPending}
        error={formError}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              SKU
            </label>
            <input
              name="sku"
              type="text"
              required
              defaultValue={editRow?.sku || ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
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
              Precio Unitario
            </label>
            <input
              name="unitPrice"
              type="number"
              required
              step="0.01"
              min={0}
              defaultValue={editRow?.unitPrice ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Precio Costo
            </label>
            <input
              name="costPrice"
              type="number"
              required
              step="0.01"
              min={0}
              defaultValue={editRow?.costPrice ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Unidad
          </label>
          <select
            name="unit"
            required
            defaultValue={editRow?.unit || ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seleccionar unidad...</option>
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </FormModal>
    </div>
  );
}
