"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { FilterBar } from "@/components/layout/filter-bar";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { useAppShell } from "@/providers/app-shell-provider";
import { useAuth } from "@/providers/auth-provider";
import { buildNavigationModel } from "@/lib/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { navigationConfig } = useAppShell();
  const model = buildNavigationModel(
    navigationConfig,
    pathname,
    user?.role.level ?? -1
  );
  const showModuleTabs = model.activeSection?.presentation === "horizontal";
  const showFilterBar = !model.activeSection || model.activeSection.presentation !== "horizontal";

  return (
    <div className="flex h-screen overflow-hidden bg-[color:var(--app-shell-bg)]">
      {/* Sidebar - fixed, never scrolls */}
      <Sidebar />

      {/* Main area - this is the only scrollable region */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Topbar />
        {showModuleTabs ? <ModuleTabs /> : null}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto">
          {showFilterBar ? <FilterBar /> : null}

          {/* Page content */}
          <main className="bg-[color:var(--app-shell-bg)] p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
