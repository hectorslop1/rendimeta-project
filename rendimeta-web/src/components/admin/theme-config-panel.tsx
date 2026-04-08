"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Palette,
  RefreshCcw,
  Save,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  buildThemeTemplateId,
  defaultThemeConfig,
  getContrastingTextColor,
  getThemeTemplateLibrary,
  mixColors,
  sanitizeThemeConfig,
  saveThemeTemplateLibrary,
  themePresetGroups,
  type ThemeConfig,
  type ThemeTemplateDefinition,
  type ThemeTemplateLibrary,
} from "@/lib/theme-config";
import { useAppShell } from "@/providers/app-shell-provider";
import { cn } from "@/lib/utils";

type ThemeEditorSectionId =
  | "branding"
  | "surfaces"
  | "sidebar"
  | "tables"
  | "alerts";

const THEME_EDITOR_SECTIONS: {
  id: ThemeEditorSectionId;
  label: string;
  description: string;
}[] = [
  {
    id: "branding",
    label: "Branding",
    description: "Nombre del theme, código, colores principales y modo visual.",
  },
  {
    id: "surfaces",
    label: "Superficies",
    description: "Fondos, tarjetas, topbar, títulos y jerarquía visual del portal.",
  },
  {
    id: "sidebar",
    label: "Menú lateral",
    description: "Paleta, contraste y lectura del menú lateral.",
  },
  {
    id: "tables",
    label: "Tablas",
    description: "Encabezados, filas, hover y contraste en mantenimientos.",
  },
  {
    id: "alerts",
    label: "Alertas y estados",
    description: "Éxito, advertencia, error e información del sistema.",
  },
];

const inputClass =
  "w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-soft)]";
const cardClass =
  "rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] shadow-sm";

export function ThemeConfigPanel() {
  const { themeConfig, setThemeConfig, resetThemeConfig } = useAppShell();
  const [themeDraft, setThemeDraft] = useState(themeConfig);
  const [themeSaved, setThemeSaved] = useState(false);
  const [templateMessage, setTemplateMessage] = useState("");
  const [activeSection, setActiveSection] =
    useState<ThemeEditorSectionId>("branding");
  const [templateLibrary, setTemplateLibrary] = useState<ThemeTemplateLibrary>(() =>
    getThemeTemplateLibrary()
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateNameInput, setTemplateNameInput] = useState(themeConfig.name);

  useEffect(() => {
    setThemeDraft(themeConfig);
  }, [themeConfig]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplateId(templateLibrary.activeTemplateId);
    }
  }, [selectedTemplateId, templateLibrary.activeTemplateId]);

  useEffect(() => {
    const selectedTemplate = templateLibrary.templates.find(
      (template) => template.id === selectedTemplateId
    );
    setTemplateNameInput(selectedTemplate?.name ?? themeDraft.name);
  }, [selectedTemplateId, templateLibrary.templates, themeDraft.name]);

  useEffect(() => {
    if (!themeSaved) return;
    const timer = window.setTimeout(() => setThemeSaved(false), 3000);
    return () => window.clearTimeout(timer);
  }, [themeSaved]);

  useEffect(() => {
    if (!templateMessage) return;
    const timer = window.setTimeout(() => setTemplateMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [templateMessage]);

  const previewTheme = useMemo(() => sanitizeThemeConfig(themeDraft), [themeDraft]);
  const themeHasChanges =
    JSON.stringify(previewTheme) !== JSON.stringify(sanitizeThemeConfig(themeConfig));
  const selectedTemplate =
    templateLibrary.templates.find((template) => template.id === selectedTemplateId) ?? null;
  const customTemplates = templateLibrary.templates.filter(
    (template) => template.source === "custom"
  );

  function handleThemeField<K extends keyof ThemeConfig>(
    field: K,
    value: ThemeConfig[K]
  ) {
    setThemeDraft((current) => ({ ...current, [field]: value }));
  }

  function persistTemplateLibrary(nextLibrary: ThemeTemplateLibrary) {
    setTemplateLibrary(nextLibrary);
    saveThemeTemplateLibrary(nextLibrary);
  }

  function buildNextTemplateLibrary(
    customTemplateDrafts: ThemeTemplateDefinition[],
    activeTemplateId: string
  ) {
    const systemTemplates = templateLibrary.templates.filter(
      (template) => template.source === "system"
    );
    const customTemplatesSorted = [...customTemplateDrafts].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );

    return {
      version: 1 as const,
      activeTemplateId,
      templates: [...systemTemplates, ...customTemplatesSorted],
    };
  }

  function buildUniqueTemplateId(baseId: string, excludeId?: string) {
    let candidate = baseId;
    let suffix = 2;

    while (
      templateLibrary.templates.some(
        (template) => template.id === candidate && template.id !== excludeId
      )
    ) {
      candidate = `${baseId}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  function loadTemplate(template: ThemeTemplateDefinition) {
    setThemeDraft(template.theme);
    setSelectedTemplateId(template.id);
    setTemplateNameInput(template.name);
  }

  function handleThemeSave() {
    setThemeConfig(previewTheme);
    setThemeSaved(true);

    if (selectedTemplateId) {
      persistTemplateLibrary({
        ...templateLibrary,
        activeTemplateId: selectedTemplateId,
      });
    }
  }

  function handleThemeReset() {
    resetThemeConfig();
    const defaultTemplateId = buildThemeTemplateId(
      defaultThemeConfig.name,
      defaultThemeConfig.code
    );
    const nextLibrary = {
      ...getThemeTemplateLibrary(),
      activeTemplateId: defaultTemplateId,
    };
    persistTemplateLibrary(nextLibrary);
    setThemeDraft(defaultThemeConfig);
    setSelectedTemplateId(defaultTemplateId);
    setActiveSection("branding");
    setThemeSaved(true);
  }

  function handleSaveCurrentTemplate() {
    if (!selectedTemplate || selectedTemplate.source !== "custom") return;

    const name = templateNameInput.trim() || previewTheme.name;
    const nextTemplate: ThemeTemplateDefinition = {
      ...selectedTemplate,
      name,
      code: previewTheme.code,
      updatedAt: new Date().toISOString(),
      theme: sanitizeThemeConfig({
        ...previewTheme,
        name,
      }),
    };

    const nextCustomTemplates = customTemplates.map((template) =>
      template.id === nextTemplate.id ? nextTemplate : template
    );
    const nextLibrary = buildNextTemplateLibrary(nextCustomTemplates, nextTemplate.id);
    persistTemplateLibrary(nextLibrary);
    setSelectedTemplateId(nextTemplate.id);
    setTemplateMessage(`Template "${name}" actualizado.`);
  }

  function handleSaveThemeAsNewTemplate() {
    const name = templateNameInput.trim() || previewTheme.name;
    const baseId = buildThemeTemplateId(name, previewTheme.code);
    const nextTemplate: ThemeTemplateDefinition = {
      id: buildUniqueTemplateId(baseId),
      name,
      code: previewTheme.code,
      updatedAt: new Date().toISOString(),
      source: "custom",
      theme: sanitizeThemeConfig({
        ...previewTheme,
        name,
      }),
    };

    const nextLibrary = buildNextTemplateLibrary(
      [...customTemplates, nextTemplate],
      nextTemplate.id
    );
    persistTemplateLibrary(nextLibrary);
    setSelectedTemplateId(nextTemplate.id);
    setTemplateNameInput(nextTemplate.name);
    setTemplateMessage(`Template "${nextTemplate.name}" guardado.`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.18fr_1fr]">
      <div className="space-y-5">
        <div className={cn(cardClass, "p-5")}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[color:var(--foreground)]">
                Biblioteca de Themes
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Carga presets, experimenta variantes y guarda tus templates favoritos.
              </p>
            </div>
            <Sparkles className="mt-1 h-5 w-5 text-[color:var(--app-primary-strong)]" />
          </div>

          <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {previewTheme.name}
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {previewTheme.code}
                </p>
              </div>
              {themeHasChanges ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  Borrador
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  Aplicado
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                previewTheme.primaryColor,
                previewTheme.secondaryColor,
                previewTheme.accentColor,
                previewTheme.tableHeaderBg,
              ].map((color) => (
                <span
                  key={color}
                  className="h-8 w-8 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleThemeReset}
                data-testid="reset-theme-button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--app-panel-border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
              >
                <RefreshCcw className="h-4 w-4" />
                Restaurar
              </button>
              <button
                type="button"
                onClick={handleThemeSave}
                data-testid="apply-theme-button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90"
              >
                <Palette className="h-4 w-4" />
                Aplicar tema
              </button>
            </div>
          </div>

          {themeSaved ? (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              Theme aplicado correctamente.
            </div>
          ) : null}

          {templateMessage ? (
            <div className="mt-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
              {templateMessage}
            </div>
          ) : null}
        </div>

        <div className={cn(cardClass, "p-5")}>
          <h3 className="text-base font-bold text-[color:var(--foreground)]">
            Guardar Template
          </h3>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Usa esta columna para crear y versionar combinaciones del tema.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                Nombre del template
              </label>
              <input
                type="text"
                value={templateNameInput}
                onChange={(event) => setTemplateNameInput(event.target.value)}
                data-testid="theme-template-name-input"
                className={inputClass}
                placeholder="Ej. Operación Ejecutiva"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSaveCurrentTemplate}
                data-testid="save-theme-template-current"
                disabled={!selectedTemplate || selectedTemplate.source !== "custom"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--app-panel-border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Actualizar actual
              </button>
              <button
                type="button"
                onClick={handleSaveThemeAsNewTemplate}
                data-testid="save-theme-template-as-new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90"
              >
                <Save className="h-4 w-4" />
                Guardar como nuevo
              </button>
            </div>

            <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                Template seleccionado
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {selectedTemplate?.name ?? "Edición libre"}
                  </p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">
                    {selectedTemplate
                      ? selectedTemplate.source === "custom"
                        ? "Template personalizado"
                        : "Preset base del sistema"
                      : "Ajuste manual sin plantilla activa"}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--app-panel-bg)] px-3 py-1 text-xs font-semibold text-[color:var(--muted-foreground)]">
                  {selectedTemplate?.source === "custom" ? "Custom" : "Base"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(cardClass, "p-5")}>
          <h3 className="text-base font-bold text-[color:var(--foreground)]">
            Templates Guardados
          </h3>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Tus variantes personalizadas viven aquí para volverlas a cargar rápido.
          </p>

          <div className="mt-4 space-y-3">
            {customTemplates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--app-panel-border)] px-4 py-5 text-sm text-[color:var(--muted-foreground)]">
                Aún no hay templates personalizados guardados.
              </div>
            ) : (
              customTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => loadTemplate(template)}
                  data-testid={`theme-template-${template.id}`}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-colors",
                    selectedTemplateId === template.id
                      ? "border-transparent bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
                      : "border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          selectedTemplateId === template.id
                            ? "text-[color:var(--primary-foreground)]/80"
                            : "text-[color:var(--muted-foreground)]"
                        )}
                      >
                        {template.code}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[
                        template.theme.primaryColor,
                        template.theme.secondaryColor,
                        template.theme.accentColor,
                      ].map((color) => (
                        <span
                          key={color}
                          className="h-5 w-5 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={cn(cardClass, "p-5")}>
          <h3 className="text-base font-bold text-[color:var(--foreground)]">
            Presets Base
          </h3>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Tómalos como punto de partida y después guarda tu propia variante.
          </p>

          <div className="mt-4 space-y-5">
            {themePresetGroups.map((group) => (
              <div key={group.section} className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                  {group.section}
                </p>
                <div className="space-y-3">
                  {group.items.map((preset) => {
                    const presetId = buildThemeTemplateId(preset.name, preset.code);
                    const active = selectedTemplateId === presetId;

                    return (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() =>
                          loadTemplate({
                            id: presetId,
                            name: preset.name,
                            code: preset.code,
                            updatedAt: "system",
                            source: "system",
                            theme: preset,
                          })
                        }
                        data-testid={`theme-preset-${preset.code.toLowerCase()}`}
                        className={cn(
                          "w-full rounded-2xl border p-4 text-left transition-colors",
                          active
                            ? "border-transparent bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
                            : "border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{preset.name}</p>
                            <p
                              className={cn(
                                "text-xs",
                                active
                                  ? "text-[color:var(--primary-foreground)]/80"
                                  : "text-[color:var(--muted-foreground)]"
                              )}
                            >
                              {preset.code}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {[
                              preset.primaryColor,
                              preset.secondaryColor,
                              preset.accentColor,
                              preset.tableHeaderBg,
                            ].map((color) => (
                              <span
                                key={color}
                                className="h-5 w-5 rounded-full border border-white/20"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <p
                          className={cn(
                            "text-xs",
                            active
                              ? "text-[color:var(--primary-foreground)]/80"
                              : "text-[color:var(--muted-foreground)]"
                          )}
                        >
                          {preset.isDarkMode ? "Tema oscuro" : "Tema claro"} con preview de
                          tablas, sidebar y estados.
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ThemeLivePreview theme={previewTheme} themeHasChanges={themeHasChanges} />

      <ThemeSectionEditor
        theme={previewTheme}
        activeSection={activeSection}
        onSectionToggle={setActiveSection}
        onFieldChange={handleThemeField}
      />
    </div>
  );
}

function ThemeSectionEditor({
  theme,
  activeSection,
  onSectionToggle,
  onFieldChange,
}: {
  theme: ThemeConfig;
  activeSection: ThemeEditorSectionId;
  onSectionToggle: (sectionId: ThemeEditorSectionId) => void;
  onFieldChange: <K extends keyof ThemeConfig>(
    field: K,
    value: ThemeConfig[K]
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <div className={cn(cardClass, "p-5")}>
        <h3 className="text-lg font-bold text-[color:var(--foreground)]">
          Configuración Detallada
        </h3>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          La tercera columna concentra la edición por acordeones para liberar la
          biblioteca de templates a la izquierda.
        </p>
      </div>

      {THEME_EDITOR_SECTIONS.map((section) => {
        const isOpen = activeSection === section.id;

        return (
          <div key={section.id} className={cn(cardClass, "overflow-hidden")}>
            <button
              type="button"
              onClick={() => onSectionToggle(section.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[color:var(--app-hover-bg)]"
            >
              <div>
                <p className="text-base font-semibold text-[color:var(--foreground)]">
                  {section.label}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  {section.description}
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] text-[color:var(--muted-foreground)]">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            </button>

            {isOpen ? (
              <div className="border-t border-[color:var(--app-panel-border)] px-5 py-5">
                {section.id === "branding" ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <ThemeField
                        label="Nombre del theme"
                        value={theme.name}
                        onChange={(value) => onFieldChange("name", value)}
                        type="text"
                      />
                      <ThemeField
                        label="Código"
                        value={theme.code}
                        onChange={(value) => onFieldChange("code", value)}
                        type="text"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <ThemeField
                        label="Color principal"
                        value={theme.primaryColor}
                        onChange={(value) => onFieldChange("primaryColor", value)}
                      />
                      <ThemeField
                        label="Color secundario"
                        value={theme.secondaryColor}
                        onChange={(value) => onFieldChange("secondaryColor", value)}
                      />
                      <ThemeField
                        label="Color terciario / acento"
                        value={theme.accentColor}
                        onChange={(value) => onFieldChange("accentColor", value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onFieldChange("isDarkMode", !theme.isDarkMode)}
                      className="inline-flex items-center gap-3 rounded-2xl border border-[color:var(--app-panel-border)] px-4 py-3 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                    >
                      {theme.isDarkMode ? (
                        <ToggleRight className="h-6 w-6 text-[color:var(--app-primary-strong)]" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-[color:var(--muted-foreground)]" />
                      )}
                      <span>
                        {theme.isDarkMode ? "Modo oscuro activo" : "Modo claro activo"}
                      </span>
                    </button>
                  </div>
                ) : null}

                {section.id === "surfaces" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ThemeField
                      label="Fondo general"
                      value={theme.backgroundColor}
                      onChange={(value) => onFieldChange("backgroundColor", value)}
                    />
                    <ThemeField
                      label="Superficie"
                      value={theme.surfaceColor}
                      onChange={(value) => onFieldChange("surfaceColor", value)}
                    />
                    <ThemeField
                      label="Borde"
                      value={theme.borderColor}
                      onChange={(value) => onFieldChange("borderColor", value)}
                    />
                    <ThemeField
                      label="Topbar"
                      value={theme.topbarColor}
                      onChange={(value) => onFieldChange("topbarColor", value)}
                    />
                    <ThemeField
                      label="Texto topbar"
                      value={theme.topbarTextColor}
                      onChange={(value) => onFieldChange("topbarTextColor", value)}
                    />
                    <ThemeField
                      label="Títulos"
                      value={theme.titleColor}
                      onChange={(value) => onFieldChange("titleColor", value)}
                    />
                    <ThemeField
                      label="Subtítulos"
                      value={theme.subtitleColor}
                      onChange={(value) => onFieldChange("subtitleColor", value)}
                    />
                  </div>
                ) : null}

                {section.id === "sidebar" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ThemeField
                      label="Sidebar"
                      value={theme.sidebarColor}
                      onChange={(value) => onFieldChange("sidebarColor", value)}
                    />
                    <ThemeField
                      label="Texto sidebar"
                      value={theme.sidebarTextColor}
                      onChange={(value) => onFieldChange("sidebarTextColor", value)}
                    />
                  </div>
                ) : null}

                {section.id === "tables" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ThemeField
                      label="Header de tabla"
                      value={theme.tableHeaderBg}
                      onChange={(value) => onFieldChange("tableHeaderBg", value)}
                    />
                    <ThemeField
                      label="Texto header"
                      value={theme.tableHeaderTextColor}
                      onChange={(value) => onFieldChange("tableHeaderTextColor", value)}
                    />
                    <ThemeField
                      label="Fila principal"
                      value={theme.tableRowBg}
                      onChange={(value) => onFieldChange("tableRowBg", value)}
                    />
                    <ThemeField
                      label="Fila alterna"
                      value={theme.tableRowAltBg}
                      onChange={(value) => onFieldChange("tableRowAltBg", value)}
                    />
                    <ThemeField
                      label="Hover de fila"
                      value={theme.tableRowHoverBg}
                      onChange={(value) => onFieldChange("tableRowHoverBg", value)}
                    />
                    <ThemeField
                      label="Texto de filas"
                      value={theme.tableRowTextColor}
                      onChange={(value) => onFieldChange("tableRowTextColor", value)}
                    />
                  </div>
                ) : null}

                {section.id === "alerts" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <ThemeField
                      label="Éxito"
                      value={theme.successColor}
                      onChange={(value) => onFieldChange("successColor", value)}
                    />
                    <ThemeField
                      label="Advertencia"
                      value={theme.warningColor}
                      onChange={(value) => onFieldChange("warningColor", value)}
                    />
                    <ThemeField
                      label="Error"
                      value={theme.dangerColor}
                      onChange={(value) => onFieldChange("dangerColor", value)}
                    />
                    <ThemeField
                      label="Información"
                      value={theme.infoColor}
                      onChange={(value) => onFieldChange("infoColor", value)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ThemeField({
  label,
  value,
  onChange,
  type = "color",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "color" | "text";
}) {
  const colorValue =
    type === "color" && /^#([0-9a-f]{6})$/i.test(value) ? value : "#000000";

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
        {label}
      </label>
      {type === "color" ? (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={colorValue}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-14 cursor-pointer rounded-lg border border-[color:var(--app-panel-border)] bg-transparent"
          />
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}

function ThemeLivePreview({
  theme,
  themeHasChanges,
}: {
  theme: ThemeConfig;
  themeHasChanges: boolean;
}) {
  const panelBorder = mixColors(
    theme.borderColor,
    theme.surfaceColor,
    theme.isDarkMode ? 0.2 : 0.45
  );
  const sidebarMuted = mixColors(theme.sidebarTextColor, theme.sidebarColor, 0.42);
  const shellBg = mixColors(
    theme.backgroundColor,
    theme.primaryColor,
    theme.isDarkMode ? 0.04 : 0.015
  );
  const successSoft = mixColors(
    theme.surfaceColor,
    theme.successColor,
    theme.isDarkMode ? 0.32 : 0.9
  );
  const warningSoft = mixColors(
    theme.surfaceColor,
    theme.warningColor,
    theme.isDarkMode ? 0.32 : 0.9
  );
  const dangerSoft = mixColors(
    theme.surfaceColor,
    theme.dangerColor,
    theme.isDarkMode ? 0.32 : 0.9
  );
  const infoSoft = mixColors(
    theme.surfaceColor,
    theme.infoColor,
    theme.isDarkMode ? 0.32 : 0.9
  );

  return (
    <div className={cn(cardClass, "p-5")}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[color:var(--foreground)]">
            Preview en Vivo
          </h3>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Sidebar, topbar, tarjetas, tabla y alertas del portal.
          </p>
        </div>
        {themeHasChanges ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            Cambios pendientes
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            Sincronizado
          </span>
        )}
      </div>

      <div
        className="overflow-hidden rounded-[24px] border"
        style={{
          backgroundColor: shellBg,
          borderColor: panelBorder,
        }}
      >
        <div className="grid min-h-[760px] md:grid-cols-[220px_1fr]">
          <aside
            className="p-4"
            style={{
              backgroundColor: theme.sidebarColor,
              color: theme.sidebarTextColor,
            }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: getContrastingTextColor(theme.primaryColor),
                }}
              >
                GL
              </div>
              <div>
                <p className="text-sm font-semibold">Gas Logística</p>
                <p className="text-xs" style={{ color: sidebarMuted }}>
                  Admin portal
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {["Vista General", "Productividad RH", "Administración"].map((label, index) => {
                const active = index === 1;
                return (
                  <div
                    key={label}
                    className="rounded-xl px-3 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: active
                        ? mixColors(theme.sidebarColor, theme.primaryColor, 0.18)
                        : "transparent",
                      color: active ? theme.sidebarTextColor : sidebarMuted,
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </aside>

          <div style={{ backgroundColor: theme.backgroundColor }}>
            <div
              className="border-b px-5 py-4"
              style={{
                backgroundColor: theme.topbarColor,
                borderColor: panelBorder,
                color: theme.topbarTextColor,
              }}
            >
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: theme.subtitleColor }}>Inicio</span>
                <span style={{ color: theme.subtitleColor }}>/</span>
                <span style={{ color: theme.subtitleColor }}>Administración</span>
                <span style={{ color: theme.subtitleColor }}>/</span>
                <span className="font-semibold">Configuración</span>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div
                className="rounded-2xl border px-4 py-4"
                style={{
                  backgroundColor: theme.surfaceColor,
                  borderColor: panelBorder,
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ color: theme.subtitleColor }}
                >
                  Productividad RH
                </p>
                <h4
                  className="mt-2 text-2xl font-black tracking-tight"
                  style={{ color: theme.titleColor }}
                >
                  Seguimiento Horario
                </h4>
                <p className="mt-1 text-sm" style={{ color: theme.subtitleColor }}>
                  Vista previa del tema aplicada al dashboard operativo.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Cumplimiento", value: "91.8%" },
                  { label: "Ventas / Hora", value: "$1,248" },
                  { label: "Bonos", value: "32" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border p-4"
                    style={{
                      backgroundColor: theme.surfaceColor,
                      borderColor: panelBorder,
                    }}
                  >
                    <p className="text-xs font-medium" style={{ color: theme.subtitleColor }}>
                      {item.label}
                    </p>
                    <p
                      className="mt-3 text-2xl font-black"
                      style={{ color: theme.titleColor }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <AlertPreview
                  icon={CheckCircle2}
                  label="Proceso completado"
                  description="La configuración fue aplicada correctamente."
                  backgroundColor={successSoft}
                  textColor={theme.successColor}
                />
                <AlertPreview
                  icon={Info}
                  label="Actualización informativa"
                  description="Tienes 3 cambios listos para revisión."
                  backgroundColor={infoSoft}
                  textColor={theme.infoColor}
                />
                <AlertPreview
                  icon={AlertTriangle}
                  label="Advertencia"
                  description="Falta revisar el layout de tablas manuales."
                  backgroundColor={warningSoft}
                  textColor={theme.warningColor}
                />
                <AlertPreview
                  icon={AlertTriangle}
                  label="Incidencia"
                  description="Hay un módulo con permisos incompletos."
                  backgroundColor={dangerSoft}
                  textColor={theme.dangerColor}
                />
              </div>

              <div
                className="rounded-2xl border"
                style={{
                  backgroundColor: theme.surfaceColor,
                  borderColor: panelBorder,
                }}
              >
                <div className="border-b px-4 py-3" style={{ borderColor: panelBorder }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: theme.titleColor }}
                      >
                        Tabla de Usuarios
                      </p>
                      <p className="text-xs" style={{ color: theme.subtitleColor }}>
                        Encabezados, filas, hover y contraste configurables.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl px-3 py-2 text-sm font-semibold"
                      style={{
                        backgroundColor: theme.primaryColor,
                        color: getContrastingTextColor(theme.primaryColor),
                      }}
                    >
                      Nuevo usuario
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-b-2xl">
                  <table className="w-full text-sm">
                    <thead style={{ backgroundColor: theme.tableHeaderBg }}>
                      <tr>
                        {["Email", "Nombre", "Rol", "Estado"].map((head) => (
                          <th
                            key={head}
                            className="px-4 py-3 text-left font-semibold"
                            style={{ color: theme.tableHeaderTextColor }}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["admin@sistema.com", "Ana Soto", "Administrador", "Activo"],
                        ["rh@sistema.com", "Luis Ramos", "RH", "Activo"],
                        ["ops@sistema.com", "Marta León", "Operativo", "Pendiente"],
                      ].map((row, index) => (
                        <tr
                          key={row[0]}
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? theme.tableRowBg : theme.tableRowAltBg,
                          }}
                        >
                          {row.map((value, colIndex) => (
                            <td
                              key={`${value}-${colIndex}`}
                              className="px-4 py-3"
                              style={{
                                color: theme.tableRowTextColor,
                                borderTop: index > 0 ? `1px solid ${panelBorder}` : "none",
                              }}
                            >
                              {colIndex === 3 ? (
                                <span
                                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor:
                                      value === "Activo" ? successSoft : warningSoft,
                                    color:
                                      value === "Activo"
                                        ? theme.successColor
                                        : theme.warningColor,
                                  }}
                                >
                                  {value}
                                </span>
                              ) : (
                                value
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertPreview({
  icon: Icon,
  label,
  description,
  backgroundColor,
  textColor,
}: {
  icon: typeof CheckCircle2;
  label: string;
  description: string;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{ backgroundColor, borderColor: textColor }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: mixColors(backgroundColor, textColor, 0.18), color: textColor }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: textColor }}>
            {label}
          </p>
          <p className="mt-1 text-xs" style={{ color: textColor }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
