export type NavigationSectionPresentation = "vertical" | "horizontal";
export type NavigationEditorLayout = "two-columns" | "three-columns";
export type NavigationSource = "system" | "custom";
export type NavigationPageType = "built-in" | "managed";

export interface AppNavItem {
  id: string;
  sectionId: string;
  href: string;
  title: string;
  description?: string;
  icon: string;
  minLevel: number;
  visible: boolean;
  order: number;
  aliases: string[];
  source: NavigationSource;
  pageType: NavigationPageType;
}

export interface NavSection {
  id: string;
  title: string;
  description: string;
  visible: boolean;
  order: number;
  presentation: NavigationSectionPresentation;
  collapsible: boolean;
  collapsedByDefault: boolean;
  source: NavigationSource;
}

export interface NavigationConfig {
  version: number;
  editorLayout: NavigationEditorLayout;
  updatedAt: string;
  sections: NavSection[];
  items: AppNavItem[];
}

export interface NavigationTemplateSummary {
  id: string;
  name: string;
  updatedAt: string;
}

export interface NavigationStatePayload {
  activeTemplateId: string;
  config: NavigationConfig;
  templates: NavigationTemplateSummary[];
}

export interface SaveNavigationConfigOptions {
  saveAsNew?: boolean;
  templateId?: string;
  templateName?: string;
}

export interface ResolvedNavSection extends NavSection {
  active: boolean;
  itemCount: number;
  items: AppNavItem[];
}

export interface NavigationModel {
  activeItem: AppNavItem | null;
  activeSection: ResolvedNavSection | null;
  breadcrumbs: string[];
  horizontalSections: ResolvedNavSection[];
  sections: ResolvedNavSection[];
  sidebarSections: ResolvedNavSection[];
}

const DEFAULT_UPDATED_AT = "2026-03-30T00:00:00.000Z";
export const NAVIGATION_CONFIG_VERSION = 1;

const SYSTEM_SECTIONS: NavSection[] = [
  {
    id: "overview",
    title: "Vista General",
    description: "Indicadores y accesos principales del tablero.",
    visible: true,
    order: 0,
    presentation: "vertical",
    collapsible: false,
    collapsedByDefault: false,
    source: "system",
  },
  {
    id: "analytics",
    title: "Análisis",
    description: "Cortes analíticos por estado, estación y tendencias.",
    visible: true,
    order: 1,
    presentation: "vertical",
    collapsible: true,
    collapsedByDefault: false,
    source: "system",
  },
  {
    id: "rh",
    title: "Productividad RH",
    description: "Seguimiento de productividad, horarios y desempeño.",
    visible: true,
    order: 2,
    presentation: "horizontal",
    collapsible: true,
    collapsedByDefault: false,
    source: "system",
  },
  {
    id: "admin",
    title: "Administración",
    description: "Configuración operativa, catálogo y reglas comerciales.",
    visible: true,
    order: 3,
    presentation: "horizontal",
    collapsible: true,
    collapsedByDefault: false,
    source: "system",
  },
];

const SYSTEM_ITEMS: AppNavItem[] = [
  {
    id: "overview",
    sectionId: "overview",
    href: "/",
    title: "Vista General",
    icon: "LayoutDashboard",
    minLevel: 0,
    visible: true,
    order: 0,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "operational",
    sectionId: "overview",
    href: "/operativos",
    title: "Operativos",
    icon: "Fuel",
    minLevel: 0,
    visible: true,
    order: 1,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "financial",
    sectionId: "overview",
    href: "/financieros",
    title: "Financieros",
    icon: "DollarSign",
    minLevel: 0,
    visible: true,
    order: 2,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "productivity-kpi",
    sectionId: "overview",
    href: "/productividad",
    title: "Productividad",
    icon: "TrendingUp",
    minLevel: 0,
    visible: true,
    order: 3,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "inventory",
    sectionId: "overview",
    href: "/inventario",
    title: "Inventario",
    icon: "Package",
    minLevel: 0,
    visible: true,
    order: 4,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "customers",
    sectionId: "overview",
    href: "/clientes",
    title: "Clientes",
    icon: "Users",
    minLevel: 0,
    visible: true,
    order: 5,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "compliance",
    sectionId: "overview",
    href: "/cumplimiento",
    title: "Cumplimiento",
    icon: "ShieldCheck",
    minLevel: 0,
    visible: true,
    order: 6,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "environmental",
    sectionId: "overview",
    href: "/ambientales",
    title: "Ambientales",
    icon: "Leaf",
    minLevel: 0,
    visible: true,
    order: 7,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "states",
    sectionId: "analytics",
    href: "/estados",
    title: "Por Estado",
    icon: "Map",
    minLevel: 0,
    visible: true,
    order: 0,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "stations",
    sectionId: "analytics",
    href: "/estaciones",
    title: "Por Estación",
    icon: "MapPin",
    minLevel: 0,
    visible: true,
    order: 1,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "trends",
    sectionId: "analytics",
    href: "/tendencias",
    title: "Tendencias",
    icon: "LineChart",
    minLevel: 0,
    visible: true,
    order: 2,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-overview",
    sectionId: "rh",
    href: "/rh",
    title: "RH General",
    icon: "UserCheck",
    minLevel: 1,
    visible: true,
    order: 0,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-employees",
    sectionId: "rh",
    href: "/rh/empleados",
    title: "Empleados",
    icon: "Users",
    minLevel: 2,
    visible: true,
    order: 1,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-hourly",
    sectionId: "rh",
    href: "/rh/seguimiento-horario",
    title: "Seguimiento Horario",
    icon: "Clock",
    minLevel: 1,
    visible: true,
    order: 2,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-planner",
    sectionId: "rh",
    href: "/rh/planificador",
    title: "Planificador Diario",
    icon: "CalendarClock",
    minLevel: 0,
    visible: true,
    order: 3,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-leaderboard",
    sectionId: "rh",
    href: "/rh/leaderboard",
    title: "Ranking",
    icon: "Trophy",
    minLevel: 0,
    visible: true,
    order: 4,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-commissions",
    sectionId: "rh",
    href: "/rh/comisiones",
    title: "Comisiones",
    icon: "Coins",
    minLevel: 0,
    visible: true,
    order: 5,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-gamification",
    sectionId: "rh",
    href: "/rh/gamificacion",
    title: "Gamificación",
    icon: "Gamepad2",
    minLevel: 0,
    visible: true,
    order: 6,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-attendance",
    sectionId: "rh",
    href: "/rh/asistencia",
    title: "Asistencia",
    icon: "CalendarDays",
    minLevel: 2,
    visible: true,
    order: 7,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-evaluations",
    sectionId: "rh",
    href: "/rh/evaluaciones",
    title: "Evaluaciones",
    icon: "ClipboardCheck",
    minLevel: 2,
    visible: true,
    order: 8,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-categories",
    sectionId: "rh",
    href: "/rh/analisis-categorias",
    title: "Por Categoría",
    icon: "PieChart",
    minLevel: 2,
    visible: true,
    order: 9,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-comparison",
    sectionId: "rh",
    href: "/rh/comparativo-estaciones",
    title: "Comparativo",
    icon: "BarChart3",
    minLevel: 3,
    visible: true,
    order: 10,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "rh-shifts",
    sectionId: "rh",
    href: "/rh/analisis-turnos",
    title: "Por Turno",
    icon: "Clock4",
    minLevel: 2,
    visible: true,
    order: 11,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-users",
    sectionId: "admin",
    href: "/admin/usuarios",
    title: "Usuarios",
    icon: "UserCog",
    minLevel: 5,
    visible: true,
    order: 0,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-catalog",
    sectionId: "admin",
    href: "/admin/catalogo",
    title: "Catálogo",
    icon: "Package",
    minLevel: 4,
    visible: true,
    order: 1,
    aliases: ["/admin/catalogo/categorias", "/admin/catalogo/productos"],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-quotas",
    sectionId: "admin",
    href: "/admin/cuotas",
    title: "Cuotas",
    icon: "Target",
    minLevel: 4,
    visible: true,
    order: 2,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-commissions",
    sectionId: "admin",
    href: "/admin/comisiones",
    title: "Reglas Comisión",
    icon: "Calculator",
    minLevel: 4,
    visible: true,
    order: 3,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-bonuses",
    sectionId: "admin",
    href: "/admin/bonos",
    title: "Bonos",
    icon: "Award",
    minLevel: 4,
    visible: true,
    order: 4,
    aliases: ["/admin/logros"],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-roles",
    sectionId: "admin",
    href: "/admin/roles",
    title: "Roles",
    icon: "Shield",
    minLevel: 4,
    visible: true,
    order: 5,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-shifts",
    sectionId: "admin",
    href: "/admin/turnos",
    title: "Turnos",
    icon: "Clock",
    minLevel: 4,
    visible: true,
    order: 6,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
  {
    id: "admin-settings",
    sectionId: "admin",
    href: "/admin/configuracion",
    title: "Configuración",
    icon: "Settings",
    minLevel: 5,
    visible: true,
    order: 7,
    aliases: [],
    source: "system",
    pageType: "built-in",
  },
];

function cloneSections(sections: NavSection[]) {
  return sections.map((section) => ({ ...section }));
}

function cloneItems(items: AppNavItem[]) {
  return items.map((item) => ({
    ...item,
    aliases: [...item.aliases],
  }));
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeOptionalText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeAliases(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return [...fallback];
  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.startsWith("/"))
    )
  );
}

function normalizePresentation(
  value: unknown,
  fallback: NavigationSectionPresentation
): NavigationSectionPresentation {
  return value === "horizontal" || value === "vertical" ? value : fallback;
}

function normalizeEditorLayout(
  value: unknown,
  fallback: NavigationEditorLayout
): NavigationEditorLayout {
  return value === "three-columns" || value === "two-columns" ? value : fallback;
}

function normalizeSource(value: unknown, fallback: NavigationSource): NavigationSource {
  return value === "custom" || value === "system" ? value : fallback;
}

function normalizePageType(value: unknown, fallback: NavigationPageType): NavigationPageType {
  return value === "managed" || value === "built-in" ? value : fallback;
}

function ensureHref(value: unknown, fallback: string) {
  const href = normalizeText(value, fallback);
  return href.startsWith("/") ? href : fallback;
}

function sortSections(sections: NavSection[]) {
  return [...sections].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, "es");
  });
}

function sortItems(items: AppNavItem[]) {
  return [...items].sort((a, b) => {
    if (a.sectionId !== b.sectionId) return a.sectionId.localeCompare(b.sectionId, "es");
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title, "es");
  });
}

function getSeedSectionMap() {
  return new Map(SYSTEM_SECTIONS.map((section) => [section.id, section]));
}

function getSeedItemMap() {
  return new Map(SYSTEM_ITEMS.map((item) => [item.id, item]));
}

function sanitizeSection(raw: unknown, fallback: NavSection): NavSection {
  const section = raw && typeof raw === "object" ? (raw as Partial<NavSection>) : {};

  return {
    id: normalizeText(section.id, fallback.id),
    title: normalizeText(section.title, fallback.title),
    description: normalizeOptionalText(section.description, fallback.description),
    visible: normalizeBoolean(section.visible, fallback.visible),
    order: normalizeNumber(section.order, fallback.order),
    presentation: normalizePresentation(section.presentation, fallback.presentation),
    collapsible: normalizeBoolean(section.collapsible, fallback.collapsible),
    collapsedByDefault: normalizeBoolean(
      section.collapsedByDefault,
      fallback.collapsedByDefault
    ),
    source: normalizeSource(section.source, fallback.source),
  };
}

function sanitizeItem(raw: unknown, fallback: AppNavItem): AppNavItem {
  const item = raw && typeof raw === "object" ? (raw as Partial<AppNavItem>) : {};

  return {
    id: normalizeText(item.id, fallback.id),
    sectionId: normalizeText(item.sectionId, fallback.sectionId),
    href: ensureHref(item.href, fallback.href),
    title: normalizeText(item.title, fallback.title),
    description: normalizeOptionalText(item.description, fallback.description ?? ""),
    icon: normalizeText(item.icon, fallback.icon),
    minLevel: Math.max(0, Math.trunc(normalizeNumber(item.minLevel, fallback.minLevel))),
    visible: normalizeBoolean(item.visible, fallback.visible),
    order: normalizeNumber(item.order, fallback.order),
    aliases: normalizeAliases(item.aliases, fallback.aliases),
    source: normalizeSource(item.source, fallback.source),
    pageType: normalizePageType(item.pageType, fallback.pageType),
  };
}

function normalizeOrdering(config: NavigationConfig): NavigationConfig {
  const sections = sortSections(config.sections).map((section, index) => ({
    ...section,
    order: index,
  }));

  const sectionIds = new Set(sections.map((section) => section.id));
  const fallbackSectionId = sections[0]?.id ?? "overview";

  const items = sections.flatMap((section) =>
    sortItems(
      config.items.filter((item) =>
        (sectionIds.has(item.sectionId) ? item.sectionId : fallbackSectionId) === section.id
      )
    ).map((item, index) => ({
      ...item,
      sectionId: section.id,
      order: index,
    }))
  );

  return {
    ...config,
    sections,
    items,
  };
}

export function buildDefaultNavigationConfig(): NavigationConfig {
  return {
    version: NAVIGATION_CONFIG_VERSION,
    editorLayout: "two-columns",
    updatedAt: DEFAULT_UPDATED_AT,
    sections: cloneSections(SYSTEM_SECTIONS),
    items: cloneItems(SYSTEM_ITEMS),
  };
}

export function sanitizeNavigationConfig(
  value: Partial<NavigationConfig> | null | undefined
): NavigationConfig {
  const defaults = buildDefaultNavigationConfig();
  const seedSections = getSeedSectionMap();
  const seedItems = getSeedItemMap();
  const rawSections = Array.isArray(value?.sections) ? value.sections : [];
  const rawItems = Array.isArray(value?.items) ? value.items : [];
  const rawSectionsById = new Map(
    rawSections
      .map((section) => [normalizeOptionalText((section as Partial<NavSection>)?.id), section] as const)
      .filter(([id]) => id)
  );
  const rawItemsById = new Map(
    rawItems
      .map((item) => [normalizeOptionalText((item as Partial<AppNavItem>)?.id), item] as const)
      .filter(([id]) => id)
  );

  const sections = defaults.sections.map((seed) =>
    sanitizeSection(rawSectionsById.get(seed.id), seed)
  );
  const items = defaults.items.map((seed) => sanitizeItem(rawItemsById.get(seed.id), seed));

  for (const rawSection of rawSections) {
    const section = rawSection as Partial<NavSection>;
    const id = normalizeOptionalText(section?.id);
    if (!id || seedSections.has(id)) continue;

    sections.push(
      sanitizeSection(section, {
        id,
        title: id,
        description: "",
        visible: true,
        order: sections.length,
        presentation: "vertical",
        collapsible: true,
        collapsedByDefault: false,
        source: "custom",
      })
    );
  }

  const sectionIds = new Set(sections.map((section) => section.id));

  for (const rawItem of rawItems) {
    const item = rawItem as Partial<AppNavItem>;
    const id = normalizeOptionalText(item?.id);
    if (!id || seedItems.has(id)) continue;

    const sectionId = sectionIds.has(normalizeOptionalText(item.sectionId))
      ? normalizeOptionalText(item.sectionId)
      : sections[0]?.id ?? "overview";
    const title = normalizeText(item.title, id);
    const fallbackHref =
      item.pageType === "managed"
        ? buildManagedModuleHref(sectionId, title)
        : ensureHref(item.href, `/modulos/${slugifyNavigationToken(sectionId)}/${slugifyNavigationToken(title)}`);

    items.push(
      sanitizeItem(item, {
        id,
        sectionId,
        href: fallbackHref,
        title,
        icon: "FolderTree",
        minLevel: 0,
        visible: true,
        order: items.length,
        aliases: [],
        source: "custom",
        pageType: normalizePageType(item.pageType, "managed"),
      })
    );
  }

  const normalized = normalizeOrdering({
    version: NAVIGATION_CONFIG_VERSION,
    editorLayout: normalizeEditorLayout(value?.editorLayout, defaults.editorLayout),
    updatedAt: normalizeText(value?.updatedAt, DEFAULT_UPDATED_AT),
    sections,
    items: items.map((item) => ({
      ...item,
      sectionId: sectionIds.has(item.sectionId)
        ? item.sectionId
        : defaults.sections[0]?.id ?? "overview",
    })),
  });

  return normalized;
}

export function slugifyNavigationToken(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "modulo";
}

export function buildManagedModuleHref(sectionId: string, itemTitle: string) {
  return `/modulos/${slugifyNavigationToken(sectionId)}/${slugifyNavigationToken(itemTitle)}`;
}

export function isPathActive(pathname: string, item: Pick<AppNavItem, "href" | "aliases">) {
  if (pathname === item.href) return true;
  if (item.href !== "/" && pathname.startsWith(`${item.href}/`)) return true;
  return item.aliases.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
}

export function findNavigationItemByPath(
  config: NavigationConfig,
  pathname: string
) {
  return sanitizeNavigationConfig(config).items.find((item) => isPathActive(pathname, item)) ?? null;
}

export function getEditorSections(config: NavigationConfig): ResolvedNavSection[] {
  const safeConfig = sanitizeNavigationConfig(config);
  const sortedSections = sortSections(safeConfig.sections);
  const sortedItems = sortItems(safeConfig.items);

  return sortedSections.map((section) => {
    const items = sortedItems.filter((item) => item.sectionId === section.id);

    return {
      ...section,
      active: false,
      itemCount: items.length,
      items,
    };
  });
}

export function buildNavigationModel(
  config: NavigationConfig,
  pathname: string,
  userLevel: number
): NavigationModel {
  const safeConfig = sanitizeNavigationConfig(config);
  const activeItem = findNavigationItemByPath(safeConfig, pathname);
  const sortedSections = sortSections(safeConfig.sections);
  const sortedItems = sortItems(safeConfig.items);

  const sections = sortedSections
    .filter((section) => section.visible)
    .map((section) => {
      const items = sortedItems.filter(
        (item) =>
          item.sectionId === section.id &&
          item.visible &&
          userLevel >= item.minLevel
      );
      const active = items.some((item) => isPathActive(pathname, item));

      return {
        ...section,
        active,
        itemCount: items.length,
        items,
      };
    })
    .filter((section) => section.items.length > 0);

  const activeSection = sections.find((section) => section.active) ?? null;
  const breadcrumbs = ["Inicio"];

  if (activeSection) breadcrumbs.push(activeSection.title);
  if (activeItem) {
    if (!activeSection || activeItem.title !== activeSection.title) {
      breadcrumbs.push(activeItem.title);
    }
  } else if (pathname === "/") {
    breadcrumbs.push("Vista General");
  } else {
    breadcrumbs.push("Página");
  }

  return {
    activeItem,
    activeSection,
    breadcrumbs,
    sections,
    sidebarSections: sections.filter((section) => section.presentation === "vertical"),
    horizontalSections: sections.filter((section) => section.presentation === "horizontal"),
  };
}
