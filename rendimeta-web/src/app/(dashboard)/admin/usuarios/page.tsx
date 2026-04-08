"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  UserPlus,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Loader2,
  Search,
} from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: string; name: string; level: number };
  employee: { id: string; firstName: string; lastName: string; employeeNumber: string } | null;
  stationIds: string[] | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface RoleOption {
  id: string;
  name: string;
  level: number;
}

export default function AdminUsuariosPage() {
  const { hasMinLevel } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/auth/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  const fetchRoles = useCallback(async () => {
    const res = await fetch("/api/hr/roles");
    if (res.ok) setRoles(await res.json());
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  if (!hasMinLevel(5)) {
    return (
      <div className="py-12 text-center text-[color:var(--muted-foreground)]">
        No tienes permisos para acceder a esta sección.
      </div>
    );
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase())
  );

  async function handleResetPassword(userId: string) {
    if (!confirm("¿Restablecer la contraseña de este usuario?")) return;
    const res = await fetch(`/api/auth/users/${userId}/reset-password`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setTempPassword(data.temporaryPassword);
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    const action = isActive ? "desactivar" : "activar";
    if (!confirm(`¿Desea ${action} este usuario?`)) return;

    if (isActive) {
      await fetch(`/api/auth/users/${userId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/auth/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
    }
    fetchUsers();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[color:var(--app-title-color)]">
          Gestión de Usuarios
        </h1>
        <button
          onClick={() => {
            setEditUser(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)] hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      {tempPassword && (
        <div className="mb-4 rounded-lg border p-4" style={{ borderColor: "var(--app-warning)", backgroundColor: "var(--app-warning-soft)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--app-warning)" }}>
            Contraseña temporal:{" "}
            <code className="rounded px-2 py-0.5 font-mono" style={{ backgroundColor: "rgba(255,255,255,0.35)" }}>
              {tempPassword}
            </code>
          </p>
          <button
            onClick={() => setTempPassword(null)}
            className="mt-1 text-xs underline"
            style={{ color: "var(--app-warning)" }}
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--app-title-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] py-2 pl-10 pr-3 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-soft)]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--app-primary-strong)]" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)]">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--app-table-header-bg)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[color:var(--app-table-header-text)]">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-[color:var(--app-table-header-text)]">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left font-medium text-[color:var(--app-table-header-text)]">
                  Rol
                </th>
                <th className="px-4 py-3 text-left font-medium text-[color:var(--app-table-header-text)]">
                  Empleado
                </th>
                <th className="px-4 py-3 text-center font-medium text-[color:var(--app-table-header-text)]">
                  Activo
                </th>
                <th className="px-4 py-3 text-left font-medium text-[color:var(--app-table-header-text)]">
                  Último Login
                </th>
                <th className="px-4 py-3 text-right font-medium text-[color:var(--app-table-header-text)]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y [--tw-divide-opacity:1] divide-[color:var(--app-panel-border)]">
              {filtered.map((u, index) => (
                <tr
                  key={u.id}
                  className="hover:bg-[color:var(--app-table-row-hover-bg)]"
                  style={{
                    backgroundColor:
                      index % 2 === 0
                        ? "var(--app-table-row-bg)"
                        : "var(--app-table-row-alt-bg)",
                  }}
                >
                  <td className="px-4 py-3 text-[color:var(--app-table-row-text)]">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 text-[color:var(--app-table-row-text)]">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[color:var(--app-subtle-bg)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--app-title-muted)]">
                      {u.role.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[color:var(--app-title-muted)]">
                    {u.employee
                      ? `${u.employee.firstName} ${u.employee.lastName} (#${u.employee.employeeNumber})`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        u.isActive
                          ? "bg-[color:var(--app-success)]"
                          : "bg-[color:var(--app-danger)]"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-[color:var(--app-title-muted)]">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditUser(u);
                          setShowModal(true);
                        }}
                        title="Editar"
                        className="rounded p-1.5 text-[color:var(--app-title-muted)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--app-table-row-text)]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(u.id)}
                        title="Reset Password"
                        className="rounded p-1.5 text-[color:var(--app-title-muted)] hover:bg-[color:var(--app-warning-soft)] hover:text-[color:var(--app-warning)]"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        title={u.isActive ? "Desactivar" : "Activar"}
                        className={`rounded p-1.5 ${
                          u.isActive
                            ? "text-[color:var(--app-title-muted)] hover:bg-[color:var(--app-danger-soft)] hover:text-[color:var(--app-danger)]"
                            : "text-[color:var(--app-title-muted)] hover:bg-[color:var(--app-success-soft)] hover:text-[color:var(--app-success)]"
                        }`}
                      >
                        {u.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[color:var(--muted-foreground)]"
                  >
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <UserFormModal
          user={editUser}
          roles={roles}
          onClose={() => setShowModal(false)}
          onSaved={(pw) => {
            setShowModal(false);
            if (pw) setTempPassword(pw);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  user,
  roles,
  onClose,
  onSaved,
}: {
  user: UserRow | null;
  roles: RoleOption[];
  onClose: () => void;
  onSaved: (tempPassword?: string) => void;
}) {
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [roleId, setRoleId] = useState(user?.role.id || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (user) {
        const res = await fetch(`/api/auth/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName, lastName, roleId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }
        onSaved();
      } else {
        const res = await fetch("/api/auth/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName, lastName, roleId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message);
        }
        const data = await res.json();
        onSaved(data.temporaryPassword);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {user ? "Editar Usuario" : "Nuevo Usuario"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Apellido
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rol
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Seleccionar rol...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Nivel {r.level})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {user ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
