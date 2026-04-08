"use client";

import { useState } from "react";
import { useEmployees, useRoles, useShifts } from "@/hooks/use-hr-data";
import { useStations } from "@/hooks/use-kpi-data";
import {
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/hooks/use-hr-crud";
import { DataTable, type DataTableColumn } from "@/components/crud/data-table";
import { FormModal } from "@/components/crud/form-modal";
import { SearchInput } from "@/components/crud/search-input";
import { Loader2, Plus, Eye } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "ON_LEAVE", label: "Licencia" },
  { value: "TERMINATED", label: "Baja" },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  ON_LEAVE:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  TERMINATED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default function EmpleadosPage() {
  const [search, setSearch] = useState("");
  const [filterStation, setFilterStation] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: employees, isLoading } = useEmployees({
    search,
    stationId: filterStation || undefined,
    roleId: filterRole || undefined,
    status: filterStatus || undefined,
  });
  const { data: roles } = useRoles();
  const { data: shifts } = useShifts();
  const { data: stations } = useStations();

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const rolesArr = Array.isArray(roles) ? roles : roles?.data ?? [];
  const shiftsArr = Array.isArray(shifts) ? shifts : shifts?.data ?? [];
  const stationsArr = Array.isArray(stations) ? stations : [];
  const employeesArr = Array.isArray(employees)
    ? employees
    : employees?.data ?? [];

  // Filter by shift client-side if needed
  const filtered = filterShift
    ? employeesArr.filter((e: any) => e.shift?.id === filterShift)
    : employeesArr;

  const columns: DataTableColumn[] = [
    { key: "employeeNumber", label: "# Empleado" },
    {
      key: "name",
      label: "Nombre",
      render: (row: any) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: "role",
      label: "Rol",
      render: (row: any) => row.role?.name ?? "—",
    },
    {
      key: "station",
      label: "Estacion",
      render: (row: any) => row.station?.name ?? "—",
    },
    {
      key: "shift",
      label: "Turno",
      render: (row: any) => row.shift?.name ?? "—",
    },
    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[row.status] ?? ""}`}
        >
          {STATUS_OPTIONS.find((o) => o.value === row.status)?.label ??
            row.status}
        </span>
      ),
    },
    {
      key: "hireDate",
      label: "Fecha Ingreso",
      render: (row: any) =>
        row.hireDate
          ? new Date(row.hireDate).toLocaleDateString("es-MX")
          : "—",
    },
    {
      key: "actions",
      label: "Detalle",
      render: (row: any) => (
        <Link
          href={`/rh/empleados/${row.id}`}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </Link>
      ),
    },
  ];

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(row: any) {
    setEditing(row);
    setModalOpen(true);
  }

  async function handleSubmit(formData: Record<string, any>) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete(row: any) {
    if (confirm(`Eliminar empleado ${row.firstName} ${row.lastName}?`)) {
      await deleteMutation.mutateAsync(row.id);
    }
  }

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Empleados
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestion del personal
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Empleado
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar empleado..."
          />
        </div>
        <select
          value={filterStation}
          onChange={(e) => setFilterStation(e.target.value)}
          className={selectClass}
        >
          <option value="">Todas las estaciones</option>
          {stationsArr.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los roles</option>
          {rolesArr.map((r: any) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={filterShift}
          onChange={(e) => setFilterShift(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los turnos</option>
          {shiftsArr.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No se encontraron empleados"
      />

      {/* Create/Edit Modal */}
      <FormModal
        title={editing ? "Editar Empleado" : "Nuevo Empleado"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        error={
          (createMutation.error as Error)?.message ||
          (updateMutation.error as Error)?.message ||
          undefined
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              # Empleado
            </label>
            <input
              name="employeeNumber"
              defaultValue={editing?.employeeNumber ?? ""}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Nombre
            </label>
            <input
              name="firstName"
              defaultValue={editing?.firstName ?? ""}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Apellido
            </label>
            <input
              name="lastName"
              defaultValue={editing?.lastName ?? ""}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={editing?.email ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Telefono
            </label>
            <input
              name="phone"
              defaultValue={editing?.phone ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Rol
            </label>
            <select
              name="roleId"
              defaultValue={editing?.role?.id ?? ""}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Seleccionar...</option>
              {rolesArr.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Turno
            </label>
            <select
              name="shiftId"
              defaultValue={editing?.shift?.id ?? ""}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Seleccionar...</option>
              {shiftsArr.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Estacion
            </label>
            <select
              name="stationId"
              defaultValue={editing?.station?.id ?? ""}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Seleccionar...</option>
              {stationsArr.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Fecha Ingreso
            </label>
            <input
              name="hireDate"
              type="date"
              defaultValue={
                editing?.hireDate
                  ? new Date(editing.hireDate).toISOString().split("T")[0]
                  : ""
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              name="status"
              defaultValue={editing?.status ?? "ACTIVE"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
