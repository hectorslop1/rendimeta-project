"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/crud/data-table";
import { FormModal } from "@/components/crud/form-modal";
import { StatusBadge } from "@/components/crud/status-badge";
import { SearchInput } from "@/components/crud/search-input";
import { useShifts } from "@/hooks/use-hr-data";
import { useCreateShift, useUpdateShift } from "@/hooks/use-hr-crud";

interface ShiftRow {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  isActive: boolean;
}

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export default function AdminTurnosPage() {
  const { data, isLoading } = useShifts();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState<ShiftRow | null>(null);
  const [formError, setFormError] = useState("");

  const shifts: ShiftRow[] = Array.isArray(data) ? data : [];
  const filtered = shifts.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditRow(null);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(row: ShiftRow) {
    setEditRow(row);
    setFormError("");
    setShowModal(true);
  }

  async function handleSubmit(data: Record<string, any>) {
    setFormError("");
    try {
      const payload = {
        name: data.name,
        startHour: Number(data.startHour),
        endHour: Number(data.endHour),
      };
      if (editRow) {
        await updateShift.mutateAsync({ id: editRow.id, ...payload });
      } else {
        await createShift.mutateAsync(payload);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  const columns = [
    { key: "name", label: "Nombre" },
    {
      key: "startHour",
      label: "Hora Inicio",
      render: (row: ShiftRow) => formatHour(row.startHour),
    },
    {
      key: "endHour",
      label: "Hora Fin",
      render: (row: ShiftRow) => formatHour(row.endHour),
    },
    {
      key: "isActive",
      label: "Activo",
      render: (row: ShiftRow) => <StatusBadge active={row.isActive} />,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Turnos
        </h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Turno
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar turnos..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onEdit={openEdit}
        emptyMessage="No se encontraron turnos"
      />

      <FormModal
        title={editRow ? "Editar Turno" : "Nuevo Turno"}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={createShift.isPending || updateShift.isPending}
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hora Inicio (0-23)
            </label>
            <input
              name="startHour"
              type="number"
              required
              min={0}
              max={23}
              defaultValue={editRow?.startHour ?? 6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hora Fin (0-23)
            </label>
            <input
              name="endHour"
              type="number"
              required
              min={0}
              max={23}
              defaultValue={editRow?.endHour ?? 14}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
