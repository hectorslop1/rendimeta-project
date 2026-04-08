"use client";

import { usePathname } from "next/navigation";
import { Sun, Moon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";
import { buildNavigationModel } from "@/lib/navigation";
import { useAppShell } from "@/providers/app-shell-provider";
import { useAuth } from "@/providers/auth-provider";

export function Topbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { themeConfig, toggleThemeMode, navigationConfig } = useAppShell();
  const { breadcrumbs } = buildNavigationModel(
    navigationConfig,
    pathname,
    user?.role.level ?? -1
  );

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[color:var(--app-panel-border)] bg-[color:var(--app-topbar-bg)] text-[color:var(--app-topbar-text)] px-4 lg:px-6">
      {/* Breadcrumbs - offset for mobile menu button */}
      <nav className="flex items-center gap-1 pl-10 lg:pl-0" aria-label="Navegación">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight className="h-4 w-4 text-[color:var(--app-title-muted)]" />
            )}
            <span
              className={cn(
                "text-sm",
                idx === breadcrumbs.length - 1
                  ? "font-semibold text-[color:var(--app-topbar-text)]"
                  : "text-[color:var(--app-title-muted)]"
              )}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleThemeMode}
          className="rounded-lg p-2 text-[color:var(--app-title-muted)] transition-colors hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--app-topbar-text)]"
          aria-label="Cambiar tema"
        >
          {themeConfig.isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
