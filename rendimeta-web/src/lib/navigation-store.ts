import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildDefaultNavigationConfig,
  sanitizeNavigationConfig,
  slugifyNavigationToken,
  type NavigationConfig,
  type NavigationStatePayload,
  type NavigationTemplateSummary,
  type SaveNavigationConfigOptions,
} from "@/lib/navigation";

const NAVIGATION_DIRECTORY = path.join(process.cwd(), "data", "navigation");
const NAVIGATION_CONFIG_FILE = path.join(NAVIGATION_DIRECTORY, "menu.config.json");
const NAVIGATION_TEMPLATES_FILE = path.join(
  NAVIGATION_DIRECTORY,
  "menu.templates.json"
);
const TEMPLATE_LIBRARY_VERSION = 1;
const DEFAULT_TEMPLATE_ID = "menu-base";
const DEFAULT_TEMPLATE_NAME = "Menu Base";

interface StoredNavigationTemplate extends NavigationTemplateSummary {
  config: NavigationConfig;
}

interface NavigationTemplateLibrary {
  version: number;
  activeTemplateId: string;
  templates: StoredNavigationTemplate[];
}

async function ensureNavigationDirectory() {
  await mkdir(NAVIGATION_DIRECTORY, { recursive: true });
}

async function writeJsonFile(targetFile: string, data: unknown) {
  const tempFile = `${targetFile}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tempFile, targetFile);
}

function buildDefaultTemplateRecord(config = buildDefaultNavigationConfig()): StoredNavigationTemplate {
  return {
    id: DEFAULT_TEMPLATE_ID,
    name: DEFAULT_TEMPLATE_NAME,
    updatedAt: config.updatedAt,
    config: sanitizeNavigationConfig(config),
  };
}

function ensureUniqueTemplateId(baseId: string, existingIds: string[]) {
  const initialId = slugifyNavigationToken(baseId) || "menu";
  if (!existingIds.includes(initialId)) return initialId;

  let index = 2;
  while (existingIds.includes(`${initialId}-${index}`)) {
    index += 1;
  }

  return `${initialId}-${index}`;
}

function normalizeTemplateName(name: string | undefined, fallback: string) {
  return name?.trim() || fallback;
}

function sanitizeTemplateLibrary(
  library: NavigationTemplateLibrary | null | undefined
): NavigationTemplateLibrary {
  const defaultTemplate = buildDefaultTemplateRecord();
  const inputTemplates = Array.isArray(library?.templates) ? library.templates : [defaultTemplate];
  const seenIds = new Set<string>();

  const templates = inputTemplates.map((template, index) => {
    const fallbackId = index === 0 ? DEFAULT_TEMPLATE_ID : `menu-${index + 1}`;
    let templateId = slugifyNavigationToken(template?.id || fallbackId) || fallbackId;
    if (seenIds.has(templateId)) {
      templateId = ensureUniqueTemplateId(templateId, Array.from(seenIds));
    }
    seenIds.add(templateId);

    const config = sanitizeNavigationConfig(template?.config ?? buildDefaultNavigationConfig());

    return {
      id: templateId,
      name: normalizeTemplateName(
        typeof template?.name === "string" ? template.name : undefined,
        index === 0 ? DEFAULT_TEMPLATE_NAME : `Menu ${index + 1}`
      ),
      updatedAt: template?.updatedAt || config.updatedAt,
      config,
    };
  });

  const activeTemplateId = templates.some((template) => template.id === library?.activeTemplateId)
    ? (library?.activeTemplateId as string)
    : templates[0]?.id ?? defaultTemplate.id;

  return {
    version: TEMPLATE_LIBRARY_VERSION,
    activeTemplateId,
    templates: templates.length ? templates : [defaultTemplate],
  };
}

async function ensureNavigationConfigFile() {
  await ensureNavigationDirectory();

  try {
    await readFile(NAVIGATION_CONFIG_FILE, "utf8");
  } catch {
    await writeJsonFile(NAVIGATION_CONFIG_FILE, buildDefaultNavigationConfig());
  }
}

async function ensureNavigationTemplatesFile() {
  await ensureNavigationDirectory();

  try {
    await readFile(NAVIGATION_TEMPLATES_FILE, "utf8");
    return;
  } catch {
    await ensureNavigationConfigFile();
  }

  let baseConfig = buildDefaultNavigationConfig();

  try {
    const rawConfig = await readFile(NAVIGATION_CONFIG_FILE, "utf8");
    baseConfig = sanitizeNavigationConfig(JSON.parse(rawConfig) as NavigationConfig);
  } catch {
    baseConfig = buildDefaultNavigationConfig();
  }

  await writeJsonFile(
    NAVIGATION_TEMPLATES_FILE,
    sanitizeTemplateLibrary({
      version: TEMPLATE_LIBRARY_VERSION,
      activeTemplateId: DEFAULT_TEMPLATE_ID,
      templates: [
        {
          ...buildDefaultTemplateRecord(baseConfig),
          id: DEFAULT_TEMPLATE_ID,
          name: DEFAULT_TEMPLATE_NAME,
        },
      ],
    })
  );
}

async function readNavigationTemplateLibrary() {
  await ensureNavigationTemplatesFile();

  try {
    const raw = await readFile(NAVIGATION_TEMPLATES_FILE, "utf8");
    const library = sanitizeTemplateLibrary(JSON.parse(raw) as NavigationTemplateLibrary);
    return library;
  } catch {
    return sanitizeTemplateLibrary(null);
  }
}

async function syncActiveNavigationConfigFile(library: NavigationTemplateLibrary) {
  const activeTemplate =
    library.templates.find((template) => template.id === library.activeTemplateId) ??
    library.templates[0] ??
    buildDefaultTemplateRecord();

  await writeJsonFile(NAVIGATION_CONFIG_FILE, activeTemplate.config);
}

async function writeNavigationTemplateLibrary(library: NavigationTemplateLibrary) {
  const normalizedLibrary = sanitizeTemplateLibrary(library);
  await writeJsonFile(NAVIGATION_TEMPLATES_FILE, normalizedLibrary);
  await syncActiveNavigationConfigFile(normalizedLibrary);
  return normalizedLibrary;
}

function buildNavigationStatePayload(
  library: NavigationTemplateLibrary
): NavigationStatePayload {
  const activeTemplate =
    library.templates.find((template) => template.id === library.activeTemplateId) ??
    library.templates[0] ??
    buildDefaultTemplateRecord();

  return {
    activeTemplateId: activeTemplate.id,
    config: sanitizeNavigationConfig(activeTemplate.config),
    templates: library.templates.map((template) => ({
      id: template.id,
      name: template.name,
      updatedAt: template.updatedAt,
    })),
  };
}

export async function getNavigationConfig() {
  const library = await readNavigationTemplateLibrary();
  await syncActiveNavigationConfigFile(library);
  return buildNavigationStatePayload(library);
}

export async function saveNavigationConfig(
  config: NavigationConfig,
  options: SaveNavigationConfigOptions = {}
) {
  const library = await readNavigationTemplateLibrary();
  const now = new Date().toISOString();
  const normalizedConfig = sanitizeNavigationConfig({
    ...config,
    updatedAt: now,
  });

  let nextTemplates = [...library.templates];
  let activeTemplateId = library.activeTemplateId;

  if (options.saveAsNew) {
    const templateName = normalizeTemplateName(
      options.templateName,
      `Menu ${library.templates.length + 1}`
    );
    const templateId = ensureUniqueTemplateId(
      options.templateName || templateName,
      nextTemplates.map((template) => template.id)
    );

    nextTemplates.push({
      id: templateId,
      name: templateName,
      updatedAt: now,
      config: normalizedConfig,
    });
    activeTemplateId = templateId;
  } else {
    const templateId = options.templateId || library.activeTemplateId;
    const targetIndex = nextTemplates.findIndex((template) => template.id === templateId);
    if (targetIndex === -1) {
      throw new Error("Template de menú no encontrado");
    }

    nextTemplates[targetIndex] = {
      ...nextTemplates[targetIndex],
      name: normalizeTemplateName(options.templateName, nextTemplates[targetIndex].name),
      updatedAt: now,
      config: normalizedConfig,
    };
    activeTemplateId = nextTemplates[targetIndex].id;
  }

  const updatedLibrary = await writeNavigationTemplateLibrary({
    ...library,
    activeTemplateId,
    templates: nextTemplates,
  });

  return buildNavigationStatePayload(updatedLibrary);
}

export async function activateNavigationTemplate(templateId: string) {
  const library = await readNavigationTemplateLibrary();
  if (!library.templates.some((template) => template.id === templateId)) {
    throw new Error("Template de menú no encontrado");
  }

  const updatedLibrary = await writeNavigationTemplateLibrary({
    ...library,
    activeTemplateId: templateId,
  });

  return buildNavigationStatePayload(updatedLibrary);
}

export { NAVIGATION_CONFIG_FILE, NAVIGATION_TEMPLATES_FILE, DEFAULT_TEMPLATE_ID };
