"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import { Fuel, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--app-shell-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--app-primary-strong)] border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_var(--app-primary-soft),_var(--app-shell-bg)_48%)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)] shadow-lg">
            <Fuel className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
            Gas Logística
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Panel de Control
          </p>
        </div>

        <div className="rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-6 shadow-sm">
          <LoginForm />
        </div>

        {/* --- Usuarios de prueba (temporal) --- */}
        <TestUsersPanel />
      </div>
    </div>
  );
}

const TEST_USERS = [
  { email: "admin@sistema.com", role: "Super Admin", level: 5, color: "rose" },
  { email: "administrador@sistema.com", role: "Administrador", level: 4, color: "purple" },
  { email: "gerente.regional@sistema.com", role: "Gerente Regional", level: 3, color: "blue" },
  { email: "gerente.estacion@sistema.com", role: "Gerente Estación", level: 2, color: "cyan" },
  { email: "supervisor@sistema.com", role: "Encargado Turno", level: 1, color: "amber" },
  { email: "empleado@sistema.com", role: "Despachador", level: 0, color: "gray" },
] as const;

function TestUsersPanel() {
  const { login } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  async function quickLogin(email: string) {
    setLoading(email);
    try {
      await login(email, "admin123");
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-4 dark:border-amber-700 dark:bg-amber-900/10">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
        Acceso rápido de prueba
      </p>
      <div className="grid gap-1.5">
        {TEST_USERS.map((u) => (
          <button
            key={u.email}
            onClick={() => quickLogin(u.email)}
            disabled={loading !== null}
            data-testid={`quick-login-${u.email}`}
            className="flex items-center justify-between rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-left text-sm transition-colors hover:border-[color:var(--app-primary-strong)] hover:bg-[color:var(--app-hover-bg)] disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {u.level}
              </span>
              <div>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {u.role}
                </span>
                <span className="ml-2 text-xs text-gray-400">{u.email}</span>
              </div>
            </div>
            {loading === u.email ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
            ) : (
              <span className="text-xs text-gray-400">admin123</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
