"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Loader2 } from "lucide-react";

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
    <>
      <AnimatedBackground />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo Rendimeta */}
          <div className="mb-8 flex flex-col items-center animate-[fadeIn_0.6s_ease-out]">
            <Image
              src="/RendimetaLogo.png"
              alt="Rendimeta"
              width={180}
              height={60}
              priority
              className="h-auto w-auto"
            />
            <h1 className="mt-4 bg-gradient-to-r from-[#E6007A] via-[#7A28FF] to-[#669bf4] bg-clip-text text-5xl font-bold text-transparent drop-shadow-sm">
              Rendimeta
            </h1>
          </div>

          {/* Formulario de login */}
          <div className="rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
            <LoginForm />
          </div>

          {/* RendiChicas endorsement */}
          <div className="mt-8 flex flex-col items-center gap-2 animate-[fadeIn_1s_ease-out_0.4s_both]">
            <p className="text-xs text-gray-500">Una herramienta de</p>
            <Image
              src="/rendichicas-logo.png"
              alt="RendiChicas"
              width={120}
              height={32}
              className="h-auto w-auto"
            />
          </div>

          {/* --- Usuarios de prueba (temporal) --- */}
          <div className="animate-[fadeIn_1.2s_ease-out_0.6s_both]">
            <TestUsersPanel />
          </div>
        </div>
      </div>
    </>
  );
}

const TEST_USERS = [
  { email: "admin@sistema.com", role: "Super Admin", level: 5 },
  { email: "gerente.regional@sistema.com", role: "Gerente Regional", level: 3 },
  { email: "supervisor@sistema.com", role: "Supervisor", level: 1 },
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
    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-amber-600">
        Acceso Rápido (Desarrollo)
      </p>
      <div className="grid gap-2">
        {TEST_USERS.map((u) => (
          <button
            key={u.email}
            onClick={() => quickLogin(u.email)}
            disabled={loading !== null}
            data-testid={`quick-login-${u.email}`}
            className="group flex items-center justify-between rounded-lg bg-white px-4 py-2.5 text-left text-sm shadow-sm transition-all hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-xs font-bold text-white">
                {u.level}
              </span>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">{u.role}</span>
                <span className="text-xs text-gray-500">{u.email}</span>
              </div>
            </div>
            {loading === u.email ? (
              <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
            ) : (
              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                admin123
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
