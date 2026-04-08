export interface ThemeConfig {
  name: string;
  code: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  borderColor: string;
  sidebarColor: string;
  sidebarTextColor: string;
  topbarColor: string;
  topbarTextColor: string;
  titleColor: string;
  subtitleColor: string;
  tableHeaderBg: string;
  tableHeaderTextColor: string;
  tableRowBg: string;
  tableRowAltBg: string;
  tableRowHoverBg: string;
  tableRowTextColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  infoColor: string;
  isDarkMode: boolean;
}

export interface ThemePresetGroup {
  section: string;
  items: ThemeConfig[];
}

export type ThemeTemplateSource = "system" | "custom";

export interface ThemeTemplateDefinition {
  id: string;
  name: string;
  code: string;
  updatedAt: string;
  source: ThemeTemplateSource;
  theme: ThemeConfig;
}

export interface ThemeTemplateLibrary {
  version: 1;
  activeTemplateId: string;
  templates: ThemeTemplateDefinition[];
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

export const THEME_STORAGE_KEY = "rendimeta.themeConfig";
export const THEME_TEMPLATE_LIBRARY_STORAGE_KEY = "rendimeta.themeTemplates";

export const defaultThemeConfig: ThemeConfig = {
  name: "Rendimeta Core",
  code: "RENDIMETA",
  primaryColor: "#E6007A",
  secondaryColor: "#7A28FF",
  accentColor: "#2DE2E2",
  backgroundColor: "#F8F9FA",
  surfaceColor: "#FFFFFF",
  borderColor: "#E2E8F0",
  sidebarColor: "#2D3436",
  sidebarTextColor: "#F8F9FA",
  topbarColor: "#FFFFFF",
  topbarTextColor: "#2D3436",
  titleColor: "#2D3436",
  subtitleColor: "#636E72",
  tableHeaderBg: "#F8F9FA",
  tableHeaderTextColor: "#636E72",
  tableRowBg: "#FFFFFF",
  tableRowAltBg: "#FCFDFE",
  tableRowHoverBg: "#FFF0F7",
  tableRowTextColor: "#2D3436",
  successColor: "#00B894",
  warningColor: "#FDAA5E",
  dangerColor: "#FF6B6B",
  infoColor: "#2DE2E2",
  isDarkMode: false,
};

export function normalizeHexColor(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^#([0-9A-F]{6}|[0-9A-F]{3})$/.test(normalized)) return null;
  if (normalized.length === 4) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }
  return normalized;
}

function parseHexColor(value: string): RGB | null {
  const normalized = normalizeHexColor(value);
  if (!normalized) return null;

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function toHexColor({ r, g, b }: RGB) {
  const channels = [r, g, b].map((channel) =>
    Math.max(0, Math.min(255, Math.round(channel)))
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${channels.join("").toUpperCase()}`;
}

export function mixColors(base: string, target: string, ratio: number) {
  const from =
    parseHexColor(base) ?? parseHexColor(defaultThemeConfig.primaryColor)!;
  const to =
    parseHexColor(target) ?? parseHexColor(defaultThemeConfig.surfaceColor)!;
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  return toHexColor({
    r: from.r + (to.r - from.r) * clampedRatio,
    g: from.g + (to.g - from.g) * clampedRatio,
    b: from.b + (to.b - from.b) * clampedRatio,
  });
}

export function getContrastingTextColor(color: string) {
  const rgb = parseHexColor(color);
  if (!rgb) return "#FFFFFF";

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? "#0F172A" : "#F8FAFC";
}

function buildThemePreset(overrides: Partial<ThemeConfig>): ThemeConfig {
  return sanitizeThemeConfig({
    ...defaultThemeConfig,
    ...overrides,
  });
}

export const themePresetGroups: ThemePresetGroup[] = [
  {
    section: "Rendimeta",
    items: [
      defaultThemeConfig,
      buildThemePreset({
        name: "Rendimeta Púrpura",
        code: "PURPLE",
        primaryColor: "#7A28FF",
        secondaryColor: "#E6007A",
        accentColor: "#2DE2E2",
        backgroundColor: "#F5F9FC",
        surfaceColor: "#FFFFFF",
        borderColor: "#D8E4EE",
        sidebarColor: "#0D1B2A",
        sidebarTextColor: "#F5F9FC",
        topbarColor: "#FFFFFF",
        topbarTextColor: "#0D1B2A",
        titleColor: "#102A43",
        subtitleColor: "#627D98",
        tableHeaderBg: "#EEF4FA",
        tableHeaderTextColor: "#486581",
        tableRowBg: "#FFFFFF",
        tableRowAltBg: "#F7FBFF",
        tableRowHoverBg: "#EAF2FA",
        tableRowTextColor: "#102A43",
        successColor: "#2F855A",
        warningColor: "#DD6B20",
        dangerColor: "#C53030",
        infoColor: "#2B6CB0",
        isDarkMode: false,
      }),
      buildThemePreset({
        name: "Rendimeta Cyan",
        code: "CYAN",
        primaryColor: "#2DE2E2",
        secondaryColor: "#7A28FF",
        accentColor: "#E6007A",
        backgroundColor: "#F4FBF5",
        surfaceColor: "#FFFFFF",
        borderColor: "#DCE9DE",
        sidebarColor: "#173A1A",
        sidebarTextColor: "#F4FBF5",
        topbarColor: "#FFFFFF",
        topbarTextColor: "#173A1A",
        titleColor: "#173A1A",
        subtitleColor: "#5C7A60",
        tableHeaderBg: "#EDF7EE",
        tableHeaderTextColor: "#3D5A40",
        tableRowBg: "#FFFFFF",
        tableRowAltBg: "#F7FCF7",
        tableRowHoverBg: "#E7F4E9",
        tableRowTextColor: "#1F3A24",
        successColor: "#2F855A",
        warningColor: "#C27803",
        dangerColor: "#C53030",
        infoColor: "#2B6CB0",
        isDarkMode: false,
      }),
    ],
  },
  {
    section: "Nocturno",
    items: [
      buildThemePreset({
        name: "Turno Noche",
        code: "MIDNIGHT",
        primaryColor: "#38BDF8",
        secondaryColor: "#0F172A",
        accentColor: "#A78BFA",
        backgroundColor: "#0B1120",
        surfaceColor: "#111C34",
        borderColor: "#24324F",
        sidebarColor: "#020817",
        sidebarTextColor: "#E2E8F0",
        topbarColor: "#0F172A",
        topbarTextColor: "#E2E8F0",
        titleColor: "#F8FAFC",
        subtitleColor: "#94A3B8",
        tableHeaderBg: "#16223C",
        tableHeaderTextColor: "#CBD5E1",
        tableRowBg: "#111C34",
        tableRowAltBg: "#16243F",
        tableRowHoverBg: "#1B2C4C",
        tableRowTextColor: "#E2E8F0",
        successColor: "#34D399",
        warningColor: "#FBBF24",
        dangerColor: "#F87171",
        infoColor: "#38BDF8",
        isDarkMode: true,
      }),
      buildThemePreset({
        name: "Océano Profundo",
        code: "OCEAN",
        primaryColor: "#06B6D4",
        secondaryColor: "#083344",
        accentColor: "#67E8F9",
        backgroundColor: "#06202A",
        surfaceColor: "#0B2F3C",
        borderColor: "#164E63",
        sidebarColor: "#082F49",
        sidebarTextColor: "#ECFEFF",
        topbarColor: "#0A3A4A",
        topbarTextColor: "#ECFEFF",
        titleColor: "#ECFEFF",
        subtitleColor: "#A5F3FC",
        tableHeaderBg: "#114052",
        tableHeaderTextColor: "#CFFAFE",
        tableRowBg: "#0B2F3C",
        tableRowAltBg: "#0D3645",
        tableRowHoverBg: "#12475B",
        tableRowTextColor: "#E6FFFB",
        successColor: "#2DD4BF",
        warningColor: "#F59E0B",
        dangerColor: "#FB7185",
        infoColor: "#22D3EE",
        isDarkMode: true,
      }),
    ],
  },
];

export function sanitizeThemeConfig(
  theme: Partial<ThemeConfig> | null | undefined,
): ThemeConfig {
  return {
    name: theme?.name?.trim() || defaultThemeConfig.name,
    code: theme?.code?.trim() || defaultThemeConfig.code,
    primaryColor:
      normalizeHexColor(theme?.primaryColor || "") ||
      defaultThemeConfig.primaryColor,
    secondaryColor:
      normalizeHexColor(theme?.secondaryColor || "") ||
      defaultThemeConfig.secondaryColor,
    accentColor:
      normalizeHexColor(theme?.accentColor || "") ||
      defaultThemeConfig.accentColor,
    backgroundColor:
      normalizeHexColor(theme?.backgroundColor || "") ||
      defaultThemeConfig.backgroundColor,
    surfaceColor:
      normalizeHexColor(theme?.surfaceColor || "") ||
      defaultThemeConfig.surfaceColor,
    borderColor:
      normalizeHexColor(theme?.borderColor || "") ||
      defaultThemeConfig.borderColor,
    sidebarColor:
      normalizeHexColor(theme?.sidebarColor || "") ||
      defaultThemeConfig.sidebarColor,
    sidebarTextColor:
      normalizeHexColor(theme?.sidebarTextColor || "") ||
      defaultThemeConfig.sidebarTextColor,
    topbarColor:
      normalizeHexColor(theme?.topbarColor || "") ||
      defaultThemeConfig.topbarColor,
    topbarTextColor:
      normalizeHexColor(theme?.topbarTextColor || "") ||
      defaultThemeConfig.topbarTextColor,
    titleColor:
      normalizeHexColor(theme?.titleColor || "") ||
      defaultThemeConfig.titleColor,
    subtitleColor:
      normalizeHexColor(theme?.subtitleColor || "") ||
      defaultThemeConfig.subtitleColor,
    tableHeaderBg:
      normalizeHexColor(theme?.tableHeaderBg || "") ||
      defaultThemeConfig.tableHeaderBg,
    tableHeaderTextColor:
      normalizeHexColor(theme?.tableHeaderTextColor || "") ||
      defaultThemeConfig.tableHeaderTextColor,
    tableRowBg:
      normalizeHexColor(theme?.tableRowBg || "") ||
      defaultThemeConfig.tableRowBg,
    tableRowAltBg:
      normalizeHexColor(theme?.tableRowAltBg || "") ||
      defaultThemeConfig.tableRowAltBg,
    tableRowHoverBg:
      normalizeHexColor(theme?.tableRowHoverBg || "") ||
      defaultThemeConfig.tableRowHoverBg,
    tableRowTextColor:
      normalizeHexColor(theme?.tableRowTextColor || "") ||
      defaultThemeConfig.tableRowTextColor,
    successColor:
      normalizeHexColor(theme?.successColor || "") ||
      defaultThemeConfig.successColor,
    warningColor:
      normalizeHexColor(theme?.warningColor || "") ||
      defaultThemeConfig.warningColor,
    dangerColor:
      normalizeHexColor(theme?.dangerColor || "") ||
      defaultThemeConfig.dangerColor,
    infoColor:
      normalizeHexColor(theme?.infoColor || "") || defaultThemeConfig.infoColor,
    isDarkMode: Boolean(theme?.isDarkMode),
  };
}

export function getStoredThemeConfig() {
  if (typeof window === "undefined") return defaultThemeConfig;

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return defaultThemeConfig;
    return sanitizeThemeConfig(JSON.parse(raw));
  } catch {
    return defaultThemeConfig;
  }
}

export function saveThemeConfig(theme: ThemeConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    THEME_STORAGE_KEY,
    JSON.stringify(sanitizeThemeConfig(theme)),
  );
}

function slugifyThemeTemplateValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function buildThemeTemplateId(name: string, code?: string) {
  const base = slugifyThemeTemplateValue(code || name) || "theme";
  return `theme-${base}`;
}

export function buildSystemThemeTemplates(): ThemeTemplateDefinition[] {
  const seen = new Set<string>();

  return themePresetGroups.flatMap((group) =>
    group.items.flatMap((preset) => {
      const id = buildThemeTemplateId(preset.name, preset.code);
      if (seen.has(id)) {
        return [];
      }
      seen.add(id);

      return [
        {
          id,
          name: preset.name,
          code: preset.code,
          updatedAt: "system",
          source: "system" as const,
          theme: sanitizeThemeConfig(preset),
        },
      ];
    }),
  );
}

function sanitizeThemeTemplateDefinition(
  template: Partial<ThemeTemplateDefinition> | null | undefined,
): ThemeTemplateDefinition | null {
  const name = template?.name?.trim();
  const code = template?.code?.trim();
  const source = template?.source === "system" ? "system" : "custom";

  if (!name) return null;

  return {
    id: template?.id?.trim() || buildThemeTemplateId(name, code || name),
    name,
    code: code || slugifyThemeTemplateValue(name).toUpperCase() || "THEME",
    updatedAt: template?.updatedAt || new Date().toISOString(),
    source,
    theme: sanitizeThemeConfig(template?.theme),
  };
}

export function getThemeTemplateLibrary(): ThemeTemplateLibrary {
  const systemTemplates = buildSystemThemeTemplates();
  const defaultActiveTemplateId = systemTemplates[0]?.id || "";

  if (typeof window === "undefined") {
    return {
      version: 1,
      activeTemplateId: defaultActiveTemplateId,
      templates: systemTemplates,
    };
  }

  try {
    const raw = window.localStorage.getItem(THEME_TEMPLATE_LIBRARY_STORAGE_KEY);
    if (!raw) {
      return {
        version: 1,
        activeTemplateId: defaultActiveTemplateId,
        templates: systemTemplates,
      };
    }

    const parsed = JSON.parse(raw) as Partial<ThemeTemplateLibrary>;
    const customTemplates = Array.isArray(parsed?.templates)
      ? parsed.templates
          .map((template) =>
            sanitizeThemeTemplateDefinition({ ...template, source: "custom" }),
          )
          .filter((template): template is ThemeTemplateDefinition =>
            Boolean(template),
          )
      : [];

    const templates = [...systemTemplates, ...customTemplates];
    const activeTemplateId =
      typeof parsed?.activeTemplateId === "string" &&
      templates.some((template) => template.id === parsed.activeTemplateId)
        ? parsed.activeTemplateId
        : defaultActiveTemplateId;

    return {
      version: 1,
      activeTemplateId,
      templates,
    };
  } catch {
    return {
      version: 1,
      activeTemplateId: defaultActiveTemplateId,
      templates: systemTemplates,
    };
  }
}

export function saveThemeTemplateLibrary(library: ThemeTemplateLibrary) {
  if (typeof window === "undefined") return;

  const customTemplates = library.templates
    .filter((template) => template.source === "custom")
    .map((template) => ({
      id: template.id,
      name: template.name,
      code: template.code,
      updatedAt: template.updatedAt,
      theme: sanitizeThemeConfig(template.theme),
    }));

  window.localStorage.setItem(
    THEME_TEMPLATE_LIBRARY_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      activeTemplateId: library.activeTemplateId,
      templates: customTemplates,
    }),
  );
}

export function applyThemeConfig(
  themeInput: ThemeConfig,
  target: HTMLElement = document.documentElement,
) {
  const theme = sanitizeThemeConfig(themeInput);
  const panelBorder = mixColors(
    theme.borderColor,
    theme.surfaceColor,
    theme.isDarkMode ? 0.2 : 0.45,
  );
  const subtleSurface = mixColors(
    theme.surfaceColor,
    theme.secondaryColor,
    theme.isDarkMode ? 0.12 : 0.035,
  );
  const hoverSurface = mixColors(
    theme.surfaceColor,
    theme.primaryColor,
    theme.isDarkMode ? 0.18 : 0.075,
  );
  const sidebarMuted = mixColors(
    theme.sidebarTextColor,
    theme.sidebarColor,
    0.45,
  );
  const foreground = getContrastingTextColor(theme.backgroundColor);
  const mutedForeground = mixColors(
    theme.subtitleColor,
    theme.backgroundColor,
    0.15,
  );
  const accentBg = mixColors(
    theme.surfaceColor,
    theme.primaryColor,
    theme.isDarkMode ? 0.42 : 0.88,
  );
  const accentText = getContrastingTextColor(accentBg);

  target.classList.toggle("dark", theme.isDarkMode);
  target.style.setProperty("--background", theme.backgroundColor);
  target.style.setProperty("--foreground", foreground);
  target.style.setProperty("--muted", subtleSurface);
  target.style.setProperty("--muted-foreground", mutedForeground);
  target.style.setProperty("--border", panelBorder);
  target.style.setProperty("--card", theme.surfaceColor);
  target.style.setProperty(
    "--card-foreground",
    getContrastingTextColor(theme.surfaceColor),
  );
  target.style.setProperty("--primary", theme.primaryColor);
  target.style.setProperty(
    "--primary-foreground",
    getContrastingTextColor(theme.primaryColor),
  );
  target.style.setProperty("--accent", accentBg);
  target.style.setProperty("--accent-foreground", accentText);
  target.style.setProperty(
    "--app-primary-soft",
    mixColors(
      theme.surfaceColor,
      theme.primaryColor,
      theme.isDarkMode ? 0.22 : 0.9,
    ),
  );
  target.style.setProperty("--app-primary-strong", theme.primaryColor);
  target.style.setProperty("--app-accent-strong", theme.accentColor);
  target.style.setProperty("--app-shell-bg", theme.backgroundColor);
  target.style.setProperty("--app-panel-bg", theme.surfaceColor);
  target.style.setProperty("--app-panel-border", panelBorder);
  target.style.setProperty("--app-subtle-bg", subtleSurface);
  target.style.setProperty("--app-hover-bg", hoverSurface);
  target.style.setProperty("--app-sidebar-bg", theme.sidebarColor);
  target.style.setProperty("--app-sidebar-text", theme.sidebarTextColor);
  target.style.setProperty("--app-sidebar-muted", sidebarMuted);
  target.style.setProperty(
    "--app-sidebar-border",
    mixColors(theme.sidebarColor, "#FFFFFF", theme.isDarkMode ? 0.14 : 0.08),
  );
  target.style.setProperty("--app-topbar-bg", theme.topbarColor);
  target.style.setProperty("--app-topbar-text", theme.topbarTextColor);
  target.style.setProperty("--app-title-color", theme.titleColor);
  target.style.setProperty("--app-title-muted", theme.subtitleColor);
  target.style.setProperty("--app-table-header-bg", theme.tableHeaderBg);
  target.style.setProperty(
    "--app-table-header-text",
    theme.tableHeaderTextColor,
  );
  target.style.setProperty("--app-table-row-bg", theme.tableRowBg);
  target.style.setProperty("--app-table-row-alt-bg", theme.tableRowAltBg);
  target.style.setProperty("--app-table-row-hover-bg", theme.tableRowHoverBg);
  target.style.setProperty("--app-table-row-text", theme.tableRowTextColor);
  target.style.setProperty("--app-success", theme.successColor);
  target.style.setProperty(
    "--app-success-soft",
    mixColors(
      theme.surfaceColor,
      theme.successColor,
      theme.isDarkMode ? 0.32 : 0.9,
    ),
  );
  target.style.setProperty("--app-warning", theme.warningColor);
  target.style.setProperty(
    "--app-warning-soft",
    mixColors(
      theme.surfaceColor,
      theme.warningColor,
      theme.isDarkMode ? 0.32 : 0.9,
    ),
  );
  target.style.setProperty("--app-danger", theme.dangerColor);
  target.style.setProperty(
    "--app-danger-soft",
    mixColors(
      theme.surfaceColor,
      theme.dangerColor,
      theme.isDarkMode ? 0.32 : 0.9,
    ),
  );
  target.style.setProperty("--app-info", theme.infoColor);
  target.style.setProperty(
    "--app-info-soft",
    mixColors(
      theme.surfaceColor,
      theme.infoColor,
      theme.isDarkMode ? 0.32 : 0.9,
    ),
  );
}
