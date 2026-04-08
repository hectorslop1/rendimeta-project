"use client";

import { useState, type ReactNode } from "react";
import { Pencil, Trash2, Loader2, ChevronUp, ChevronDown } from "lucide-react";

export interface DataTableColumn {
  key: string;
  label: string;
  render?: (row: any) => ReactNode;
}

interface DataTableProps {
  columns: DataTableColumn[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No hay registros",
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : data;

  const hasActions = onEdit || onDelete;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--app-primary-strong)]" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)]">
      <table className="w-full text-sm">
        <thead className="bg-[color:var(--app-table-header-bg)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer select-none px-4 py-3 text-left font-medium text-[color:var(--app-table-header-text)] hover:text-[color:var(--app-title-color)]"
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key ? (
                    sortDir === "asc" ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )
                  ) : null}
                </span>
              </th>
            ))}
            {hasActions && (
              <th className="px-4 py-3 text-right font-medium text-[color:var(--app-table-header-text)]">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y [--tw-divide-opacity:1] divide-[color:var(--app-panel-border)]">
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="px-4 py-8 text-center text-[color:var(--muted-foreground)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className="hover:bg-[color:var(--app-table-row-hover-bg)]"
                style={{
                  backgroundColor:
                    idx % 2 === 0
                      ? "var(--app-table-row-bg)"
                      : "var(--app-table-row-alt-bg)",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[color:var(--app-table-row-text)]"
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          title="Editar"
                          className="rounded p-1.5 text-[color:var(--muted-foreground)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--foreground)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          title="Eliminar"
                          className="rounded p-1.5 text-[color:var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
