"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  LineChart,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_MAP } from "@/lib/icon-map";
import { buildNavigationModel, isPathActive } from "@/lib/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useAppShell } from "@/providers/app-shell-provider";

const COLLAPSE_STORAGE_KEY = "rendimeta.sidebarCollapsed";
const SECTION_COLLAPSE_STORAGE_KEY = "rendimeta.sectionCollapse";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
  });
  const [sectionCollapse, setSectionCollapse] = useState<
    Record<string, boolean>
  >(() => {
    if (typeof window === "undefined") return {};

    try {
      const raw = window.localStorage.getItem(SECTION_COLLAPSE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });
  const { user } = useAuth();
  const { navigationConfig } = useAppShell();

  const userLevel = user?.role.level ?? -1;
  const navigationModel = buildNavigationModel(
    navigationConfig,
    pathname,
    userLevel,
  );
  const visibleSections = navigationModel.sidebarSections;
  const horizontalShortcutSections = navigationModel.horizontalSections.filter(
    (section) => section.items.length > 0,
  );
  const hasAnalyticsSection = visibleSections.some(
    (section) => section.id === "analytics",
  );

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    window.localStorage.setItem(
      SECTION_COLLAPSE_STORAGE_KEY,
      JSON.stringify(sectionCollapse),
    );
  }, [sectionCollapse]);

  useEffect(() => {
    const nextState = visibleSections.reduce<Record<string, boolean>>(
      (acc, section) => {
        acc[section.id] =
          sectionCollapse[section.id] ?? section.collapsedByDefault;
        return acc;
      },
      {},
    );

    setSectionCollapse((current) => {
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(nextState);
      const changed =
        currentKeys.length !== nextKeys.length ||
        nextKeys.some((key) => current[key] !== nextState[key]);

      return changed ? nextState : current;
    });
  }, [sectionCollapse, visibleSections]);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-2 shadow-md lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5 text-[color:var(--foreground)]" />
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-[color:var(--app-sidebar-bg)] text-[color:var(--app-sidebar-text)] transition-all duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-16" : "lg:w-64",
          "w-64",
        )}
        style={{ borderColor: "var(--app-sidebar-border)" }}
      >
        {/* Branding */}
        <div className="flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 overflow-hidden"
            onClick={() => setOpen(false)}
          >
            {collapsed ? (
              <span className="hidden text-xl font-extrabold text-[color:var(--app-primary-strong)] lg:block">
                R
              </span>
            ) : null}
            <span
              className={cn(
                "whitespace-nowrap text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#E6007A] to-[#7A28FF] bg-clip-text text-transparent",
                collapsed && "lg:hidden",
              )}
            >
              Rendimeta
            </span>
          </Link>

          {/* Close button (mobile) */}
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-[color:var(--app-sidebar-muted)] transition-colors hover:bg-white/10 hover:text-[color:var(--app-sidebar-text)] lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse/Expand toggle (desktop) */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-lg p-1.5 text-[color:var(--app-sidebar-muted)] transition-colors hover:bg-white/10 hover:text-[color:var(--app-sidebar-text)] lg:block"
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? (
              <ChevronsRight className="h-5 w-5" />
            ) : (
              <ChevronsLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-5">
            {visibleSections.map((section) => (
              <div key={section.id} data-testid={`sidebar-group-${section.id}`}>
                <div className="mb-2 border-t border-[color:var(--app-sidebar-border)] pt-3">
                  {!collapsed ? (
                    <button
                      type="button"
                      onClick={() =>
                        section.collapsible
                          ? setSectionCollapse((current) => ({
                              ...current,
                              [section.id]: !current[section.id],
                            }))
                          : null
                      }
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 text-left",
                        section.collapsible
                          ? "hover:text-[color:var(--app-sidebar-text)]"
                          : "cursor-default",
                      )}
                    >
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--app-sidebar-muted)]">
                          {section.title}
                        </span>
                        {section.description ? (
                          <span className="mt-1 block text-[11px] text-[color:var(--app-sidebar-muted)]">
                            {section.itemCount} módulos
                          </span>
                        ) : null}
                      </div>
                      {section.collapsible ? (
                        sectionCollapse[section.id] ? (
                          <ChevronRight className="h-4 w-4 text-[color:var(--app-sidebar-muted)]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[color:var(--app-sidebar-muted)]" />
                        )
                      ) : null}
                    </button>
                  ) : null}
                </div>

                {section.collapsible && sectionCollapse[section.id] ? null : (
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = ICON_MAP[item.icon] ?? LineChart;
                      const active = isPathActive(pathname, item);

                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            title={collapsed ? item.title : undefined}
                            data-testid={`sidebar-item-${item.id}`}
                            className={cn(
                              "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              collapsed ? "lg:justify-center lg:px-0" : "gap-3",
                              active
                                ? "bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-lg shadow-pink-500/20 border border-pink-500/30"
                                : "text-[color:var(--app-sidebar-muted)] hover:bg-white/10 hover:text-white hover:translate-x-1",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5 shrink-0",
                                active
                                  ? "text-[color:var(--app-primary-strong)]"
                                  : "text-[color:var(--app-sidebar-muted)]",
                              )}
                            />
                            <span className={cn(collapsed && "lg:hidden")}>
                              {item.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {section.id === "analytics" ? (
                  <HorizontalShortcutGroup
                    collapsed={collapsed}
                    horizontalShortcutSections={horizontalShortcutSections}
                    onNavigate={() => setOpen(false)}
                  />
                ) : null}
              </div>
            ))}

            {!hasAnalyticsSection ? (
              <HorizontalShortcutGroup
                collapsed={collapsed}
                horizontalShortcutSections={horizontalShortcutSections}
                onNavigate={() => setOpen(false)}
              />
            ) : null}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-[color:var(--app-sidebar-border)]">
          <div className={cn("px-4 py-3", collapsed && "lg:px-2")}>
            <p
              className={cn(
                "text-xs text-[color:var(--app-sidebar-muted)]",
                collapsed && "lg:text-center",
              )}
            >
              {collapsed ? (
                <span className="hidden lg:inline">&copy;</span>
              ) : null}
              <span className={cn(collapsed && "lg:hidden")}>
                Rendimeta &copy; {new Date().getFullYear()}
              </span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

function HorizontalShortcutGroup({
  collapsed,
  horizontalShortcutSections,
  onNavigate,
}: {
  collapsed: boolean;
  horizontalShortcutSections: ReturnType<
    typeof buildNavigationModel
  >["horizontalSections"];
  onNavigate: () => void;
}) {
  if (horizontalShortcutSections.length === 0) return null;

  return (
    <div className="mt-5" data-testid="sidebar-productivity-system">
      {!collapsed ? (
        <div className="mb-2 border-t border-[color:var(--app-sidebar-border)] pt-3">
          <span className="block px-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--app-sidebar-muted)]">
            Sistema de Productividad
          </span>
        </div>
      ) : null}

      <ul className="space-y-1">
        {horizontalShortcutSections.map((section) => {
          const targetItem = section.items[0];
          const Icon = targetItem
            ? (ICON_MAP[targetItem.icon] ?? LineChart)
            : LineChart;

          if (!targetItem) return null;

          return (
            <li key={section.id}>
              <Link
                href={targetItem.href}
                onClick={onNavigate}
                title={collapsed ? section.title : undefined}
                data-testid={`sidebar-section-${section.id}`}
                className={cn(
                  "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "lg:justify-center lg:px-0" : "gap-3",
                  section.active
                    ? "bg-[color:var(--app-primary-soft)] text-[color:var(--app-sidebar-text)]"
                    : "text-[color:var(--app-sidebar-muted)] hover:bg-white/10 hover:text-[color:var(--app-sidebar-text)]",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    section.active
                      ? "text-[color:var(--app-primary-strong)]"
                      : "text-[color:var(--app-sidebar-muted)]",
                  )}
                />
                <span className={cn("flex-1", collapsed && "lg:hidden")}>
                  {section.title}
                </span>
                {!collapsed ? (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--app-sidebar-muted)]">
                    {section.itemCount}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
