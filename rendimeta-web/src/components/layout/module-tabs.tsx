"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildNavigationModel, isPathActive } from "@/lib/navigation";
import { ICON_MAP } from "@/lib/icon-map";
import { useAuth } from "@/providers/auth-provider";
import { useAppShell } from "@/providers/app-shell-provider";

const HORIZONTAL_COLLAPSE_STORAGE_KEY = "gaslogistica.horizontalSectionCollapse";

export function ModuleTabs() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { navigationConfig } = useAppShell();
  const [sectionCollapse, setSectionCollapse] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};

    try {
      const raw = window.localStorage.getItem(HORIZONTAL_COLLAPSE_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  const userLevel = user?.role.level ?? -1;
  const model = buildNavigationModel(
    navigationConfig,
    pathname,
    userLevel
  );
  const activeHorizontalSection =
    model.activeSection?.presentation === "horizontal" ? model.activeSection : null;
  const sections = activeHorizontalSection ? [activeHorizontalSection] : [];

  useEffect(() => {
    window.localStorage.setItem(
      HORIZONTAL_COLLAPSE_STORAGE_KEY,
      JSON.stringify(sectionCollapse)
    );
  }, [sectionCollapse]);

  useEffect(() => {
    const nextState = sections.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = sectionCollapse[section.id] ?? section.collapsedByDefault;
      return acc;
    }, {});

    setSectionCollapse((current) => {
      const currentKeys = Object.keys(current);
      const nextKeys = Object.keys(nextState);
      const changed =
        currentKeys.length !== nextKeys.length ||
        nextKeys.some((key) => current[key] !== nextState[key]);

      return changed ? nextState : current;
    });
  }, [sectionCollapse, sections]);

  if (sections.length === 0) return null;

  return (
    <div className="border-b border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-4 py-3 backdrop-blur-sm lg:px-6">
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.id}
            className={cn(
              "rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] px-4 py-3 shadow-sm",
              section.active && "border-[color:var(--app-primary-strong)]/30"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  {section.title}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  {section.description || `${section.itemCount} módulos configurados`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[color:var(--app-panel-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)]">
                  {section.itemCount} módulos
                </span>
                {section.collapsible ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSectionCollapse((current) => ({
                        ...current,
                        [section.id]: !current[section.id],
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                  >
                    {sectionCollapse[section.id] ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {sectionCollapse[section.id] ? "Abrir" : "Contraer"}
                  </button>
                ) : null}
              </div>
            </div>

            {section.collapsible && sectionCollapse[section.id] ? null : (
              <nav
                className="mt-3 flex gap-2 overflow-x-auto pb-1"
                aria-label={`Módulos ${section.title}`}
              >
                {section.items.map((item) => {
                  const Icon = ICON_MAP[item.icon];
                  const active = isPathActive(pathname, item);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      data-testid={`module-tab-${item.id}`}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        active
                          ? "border-transparent bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)] shadow-sm"
                          : "border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                      )}
                    >
                      {Icon ? <Icon className="h-4 w-4" /> : null}
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
