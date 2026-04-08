"use client";

import Link from "next/link";
import { Package, Tags, Loader2 } from "lucide-react";
import { useCategories, useProducts } from "@/hooks/use-hr-data";

export default function AdminCatalogoPage() {
  const { data: categories, isLoading: loadingCats } = useCategories();
  const { data: products, isLoading: loadingProds } = useProducts();

  const catCount = Array.isArray(categories) ? categories.length : 0;
  const prodCount = Array.isArray(products) ? products.length : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Catalogo
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra categorias y productos del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          href="/admin/catalogo/categorias"
          className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-rose-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-rose-700"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
            <Tags className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600 dark:text-gray-100 dark:group-hover:text-rose-400">
              Categorias
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loadingCats ? (
                <Loader2 className="inline h-3 w-3 animate-spin" />
              ) : (
                `${catCount} categorias registradas`
              )}
            </p>
          </div>
        </Link>

        <Link
          href="/admin/catalogo/productos"
          className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-rose-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-rose-700"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
            <Package className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 group-hover:text-rose-600 dark:text-gray-100 dark:group-hover:text-rose-400">
              Productos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loadingProds ? (
                <Loader2 className="inline h-3 w-3 animate-spin" />
              ) : (
                `${prodCount} productos registrados`
              )}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
