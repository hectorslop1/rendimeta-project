"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  GripVertical,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import { ICON_MAP, ICON_OPTIONS } from "@/lib/icon-map";
import {
  buildDefaultNavigationConfig,
  buildManagedModuleHref,
  getEditorSections,
  sanitizeNavigationConfig,
  slugifyNavigationToken,
  type AppNavItem,
  type NavigationConfig,
  type NavigationSectionPresentation,
  type NavSection,
  type ResolvedNavSection,
} from "@/lib/navigation";
import { useAppShell } from "@/providers/app-shell-provider";
import { cn } from "@/lib/utils";

const PRODUCTIVITY_GROUP_ID = "productivity-system";

type EditorItemEntry = {
  key: string;
  kind: "item";
  title: string;
  subtitle: string;
  icon: string;
  visible: boolean;
  item: AppNavItem;
};

type EditorSectionEntry = {
  key: string;
  kind: "section";
  title: string;
  subtitle: string;
  icon: string;
  visible: boolean;
  section: ResolvedNavSection;
  items: EditorItemEntry[];
};

type EditorEntry = EditorItemEntry | EditorSectionEntry;

type EditorGroup =
  | {
      id: string;
      title: string;
      description: string;
      kind: "vertical-section";
      section: ResolvedNavSection;
      entries: EditorItemEntry[];
    }
  | {
      id: typeof PRODUCTIVITY_GROUP_ID;
      title: string;
      description: string;
      kind: "productivity-system";
      entries: EditorSectionEntry[];
    };

type DragState =
  | { kind: "item"; itemId: string; sectionId: string }
  | { kind: "section"; sectionId: string }
  | null;

const inputClass =
  "w-full rounded-lg border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-3 py-2 text-sm text-[color:var(--foreground)] outline-none focus:border-[color:var(--app-primary-strong)] focus:ring-2 focus:ring-[color:var(--app-primary-soft)]";
const iconChipClass =
  "border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] text-[color:var(--foreground)] shadow-sm";

function ensureUniqueId(baseId: string, existingIds: string[]) {
  const sanitizedBase = slugifyNavigationToken(baseId);
  if (!existingIds.includes(sanitizedBase)) return sanitizedBase;

  let index = 2;
  while (existingIds.includes(`${sanitizedBase}-${index}`)) {
    index += 1;
  }

  return `${sanitizedBase}-${index}`;
}

function buildItemEntry(item: AppNavItem): EditorItemEntry {
  return {
    key: `item:${item.id}`,
    kind: "item",
    title: item.title,
    subtitle: item.href,
    icon: item.icon,
    visible: item.visible,
    item,
  };
}

function getGroupEntryKeys(group: EditorGroup) {
  if (group.kind === "vertical-section") {
    return group.entries.map((entry) => entry.key);
  }

  return group.entries.flatMap((entry) => [
    entry.key,
    ...entry.items.map((item) => item.key),
  ]);
}

function findEntryByKey(group: EditorGroup, key: string | null) {
  if (!key) return null;

  if (group.kind === "vertical-section") {
    return group.entries.find((entry) => entry.key === key) ?? null;
  }

  for (const entry of group.entries) {
    if (entry.key === key) return entry;
    const itemEntry = entry.items.find((item) => item.key === key);
    if (itemEntry) return itemEntry;
  }

  return null;
}

function buildEditorGroups(config: NavigationConfig): EditorGroup[] {
  const sections = getEditorSections(config);
  const overview = sections.find((section) => section.id === "overview");
  const analytics = sections.find((section) => section.id === "analytics");
  const horizontalSections = sections.filter((section) => section.presentation === "horizontal");
  const customVerticalSections = sections.filter(
    (section) =>
      section.presentation === "vertical" &&
      section.id !== "overview" &&
      section.id !== "analytics"
  );

  const groups: EditorGroup[] = [];

  for (const section of [overview, analytics, ...customVerticalSections]) {
    if (!section) continue;
    groups.push({
      id: section.id,
      title: section.title,
      description: section.description,
      kind: "vertical-section",
      section,
      entries: section.items.map(buildItemEntry),
    });
  }

  groups.splice(
    overview && analytics ? 2 : overview || analytics ? 1 : 0,
    0,
    {
      id: PRODUCTIVITY_GROUP_ID,
      title: "Sistema de Productividad",
      description: "Accesos laterales a Productividad RH, Administración y secciones horizontales.",
      kind: "productivity-system",
      entries: horizontalSections.map((section) => ({
        key: `section:${section.id}`,
        kind: "section",
        title: section.title,
        subtitle: `${section.itemCount} módulos internos`,
        icon: section.items[0]?.icon ?? "FolderTree",
        visible: section.visible,
        section,
        items: section.items.map(buildItemEntry),
      })),
    }
  );

  return groups;
}

export function NavigationConfigPanel() {
  const {
    activeNavigationTemplateId,
    activeNavigationTemplateName,
    activateNavigationTemplate,
    navigationConfig,
    navigationLoaded,
    navigationSaving,
    navigationTemplates,
    saveNavigationConfig,
  } = useAppShell();
  const [draft, setDraft] = useState<NavigationConfig>(navigationConfig);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("overview");
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [error, setError] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionDescription, setNewSectionDescription] = useState("");
  const [newSectionPresentation, setNewSectionPresentation] =
    useState<NavigationSectionPresentation>("vertical");
  const [newSectionCollapsible, setNewSectionCollapsible] = useState(true);
  const [newSectionCollapsedByDefault, setNewSectionCollapsedByDefault] =
    useState(false);
  const [newItemSectionId, setNewItemSectionId] = useState(
    navigationConfig.sections[0]?.id ?? "overview"
  );
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemIcon, setNewItemIcon] = useState("FolderTree");
  const [newItemIconQuery, setNewItemIconQuery] = useState("");
  const [newItemMinLevel, setNewItemMinLevel] = useState(0);
  const [newItemManagedPage, setNewItemManagedPage] = useState(true);
  const [newItemHref, setNewItemHref] = useState("");
  const [itemIconQuery, setItemIconQuery] = useState("");

  const groups = useMemo(() => buildEditorGroups(draft), [draft]);
  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  const selectedEntry = selectedGroup ? findEntryByKey(selectedGroup, selectedEntryKey) : null;

  const selectedSectionForConfig =
    selectedGroup?.kind === "vertical-section"
      ? selectedGroup.section
      : selectedEntry?.kind === "section"
        ? selectedEntry.section
        : null;

  const selectedItemForConfig =
    selectedEntry?.kind === "item" ? selectedEntry.item : null;

  const availableSectionOptions = useMemo(
    () =>
      getEditorSections(draft).map((section) => ({
        id: section.id,
        title: section.title,
      })),
    [draft]
  );

  const defaultTargetSectionId = selectedItemForConfig?.sectionId ?? selectedSectionForConfig?.id ?? "";
  const activeTargetSectionId = availableSectionOptions.some(
    (section) => section.id === newItemSectionId
  )
    ? newItemSectionId
    : defaultTargetSectionId;
  const filteredItemIcons = ICON_OPTIONS.filter((iconName) =>
    iconName.toLowerCase().includes(itemIconQuery.trim().toLowerCase())
  );
  const filteredNewItemIcons = ICON_OPTIONS.filter((iconName) =>
    iconName.toLowerCase().includes(newItemIconQuery.trim().toLowerCase())
  );

  const hasChanges =
    JSON.stringify(sanitizeNavigationConfig(draft)) !==
    JSON.stringify(sanitizeNavigationConfig(navigationConfig));

  useEffect(() => {
    setDraft({
      ...navigationConfig,
      editorLayout: "three-columns",
    });
  }, [navigationConfig]);

  useEffect(() => {
    if (!groups.length) return;

    setSelectedGroupId((current) =>
      groups.some((group) => group.id === current) ? current : groups[0].id
    );
  }, [groups]);

  useEffect(() => {
    if (!selectedGroup) {
      setSelectedEntryKey(null);
      return;
    }

    const entryExists = selectedEntryKey
      ? getGroupEntryKeys(selectedGroup).includes(selectedEntryKey)
      : false;

    if (!entryExists) {
      setSelectedEntryKey(null);
    }
  }, [selectedEntryKey, selectedGroup]);

  useEffect(() => {
    if (!saveNotice) return;
    const timer = window.setTimeout(() => setSaveNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  useEffect(() => {
    if (!availableSectionOptions.length) return;

    setNewItemSectionId((current) => {
      if (availableSectionOptions.some((section) => section.id === current)) return current;
      return defaultTargetSectionId || availableSectionOptions[0].id;
    });
  }, [availableSectionOptions, defaultTargetSectionId]);

  useEffect(() => {
    setItemIconQuery("");
  }, [selectedItemForConfig?.id]);

  function commitDraft(nextConfig: NavigationConfig) {
    setDraft(
      sanitizeNavigationConfig({
        ...nextConfig,
        editorLayout: "three-columns",
      })
    );
  }

  function updateSection(sectionId: string, patch: Partial<NavSection>) {
    commitDraft({
      ...draft,
      sections: draft.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section
      ),
    });
  }

  function updateItem(itemId: string, patch: Partial<AppNavItem>) {
    commitDraft({
      ...draft,
      items: draft.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    });
  }

  function deleteSection(sectionId: string) {
    const section = draft.sections.find((entry) => entry.id === sectionId);
    if (!section || section.source === "system") return;

    const fallbackSectionId =
      draft.sections.find((entry) => entry.id !== sectionId)?.id ?? "overview";

    commitDraft({
      ...draft,
      sections: draft.sections.filter((entry) => entry.id !== sectionId),
      items: draft.items.map((item) =>
        item.sectionId === sectionId ? { ...item, sectionId: fallbackSectionId } : item
      ),
    });

    setSelectedEntryKey(null);
    if (selectedGroupId === sectionId || selectedEntryKey === `section:${sectionId}`) {
      setSelectedGroupId("overview");
    }
  }

  function deleteItem(itemId: string) {
    const item = draft.items.find((entry) => entry.id === itemId);
    if (!item || item.source === "system") return;

    commitDraft({
      ...draft,
      items: draft.items.filter((entry) => entry.id !== itemId),
    });

    if (selectedEntryKey === `item:${itemId}`) {
      setSelectedEntryKey(null);
    }
  }

  function reorderItemsInSection(sectionId: string, sourceItemId: string, targetItemId: string) {
    if (sourceItemId === targetItemId) return;

    const sectionItems = draft.items
      .filter((item) => item.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
    const fromIndex = sectionItems.findIndex((item) => item.id === sourceItemId);
    const toIndex = sectionItems.findIndex((item) => item.id === targetItemId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextItems = [...sectionItems];
    const [moved] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, moved);

    const itemMap = new Map(nextItems.map((item, index) => [item.id, { ...item, order: index }]));

    commitDraft({
      ...draft,
      items: draft.items.map((item) => itemMap.get(item.id) ?? item),
    });
  }

  function reorderHorizontalSections(sourceSectionId: string, targetSectionId: string) {
    if (sourceSectionId === targetSectionId) return;

    const verticalSections = draft.sections
      .filter((section) => section.presentation !== "horizontal")
      .sort((a, b) => a.order - b.order);
    const horizontalSections = draft.sections
      .filter((section) => section.presentation === "horizontal")
      .sort((a, b) => a.order - b.order);
    const fromIndex = horizontalSections.findIndex((section) => section.id === sourceSectionId);
    const toIndex = horizontalSections.findIndex((section) => section.id === targetSectionId);
    if (fromIndex === -1 || toIndex === -1) return;

    const nextHorizontalSections = [...horizontalSections];
    const [moved] = nextHorizontalSections.splice(fromIndex, 1);
    nextHorizontalSections.splice(toIndex, 0, moved);

    const orderedSections = [...verticalSections, ...nextHorizontalSections].map(
      (section, index) => ({
        ...section,
        order: index,
      })
    );

    commitDraft({
      ...draft,
      sections: orderedSections,
    });
  }

  function handleEntryDrop(entry: EditorEntry) {
    if (!dragState || !selectedGroup) return;

    if (selectedGroup.kind === "vertical-section") {
      if (dragState.kind !== "item" || entry.kind !== "item") return;
      reorderItemsInSection(selectedGroup.section.id, dragState.itemId, entry.item.id);
      setDragState(null);
      return;
    }

    if (selectedGroup.kind === "productivity-system") {
      if (dragState.kind === "section" && entry.kind === "section") {
        reorderHorizontalSections(dragState.sectionId, entry.section.id);
        setDragState(null);
        return;
      }

      if (dragState.kind === "item" && entry.kind === "item") {
        if (dragState.sectionId !== entry.item.sectionId) return;
        reorderItemsInSection(entry.item.sectionId, dragState.itemId, entry.item.id);
        setDragState(null);
      }
    }
  }

  async function handleSave() {
    setError("");
    setSaveNotice("");

    try {
      const savedConfig = await saveNavigationConfig({
        ...draft,
        editorLayout: "three-columns",
      });
      setDraft(savedConfig);
      setSaveNotice(`Template "${activeNavigationTemplateName}" guardado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el menú");
    }
  }

  async function handleSaveAsNewTemplate() {
    if (!newTemplateName.trim()) {
      setError("Escribe un nombre para guardar el template como nuevo.");
      return;
    }

    setError("");
    setSaveNotice("");

    try {
      const savedConfig = await saveNavigationConfig(
        {
          ...draft,
          editorLayout: "three-columns",
        },
        {
          saveAsNew: true,
          templateName: newTemplateName.trim(),
        }
      );
      setDraft(savedConfig);
      setSaveNotice(`Template "${newTemplateName.trim()}" creado y activado.`);
      setNewTemplateName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando template de menú");
    }
  }

  function handleResetToBase() {
    commitDraft({
      ...buildDefaultNavigationConfig(),
      editorLayout: "three-columns",
    });
    setSelectedGroupId("overview");
    setSelectedEntryKey(null);
    setError("");
    setSaveNotice("");
  }

  async function handleTemplateChange(nextTemplateId: string) {
    if (nextTemplateId === activeNavigationTemplateId) return;

    if (
      hasChanges &&
      typeof window !== "undefined" &&
      !window.confirm(
        "Hay cambios sin guardar en el menú actual. ¿Quieres descartarlos y cargar otra plantilla?"
      )
    ) {
      return;
    }

    setError("");
    setSaveNotice("");

    try {
      await activateNavigationTemplate(nextTemplateId);
      setSelectedGroupId("overview");
      setSelectedEntryKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando el template de menú");
    }
  }

  function handleGroupSelect(groupId: string) {
    setSelectedGroupId(groupId);
    setSelectedEntryKey(null);
  }

  function handleEntrySelect(entry: EditorEntry) {
    setSelectedEntryKey(entry.key);

    if (entry.kind === "item") {
      setNewItemSectionId(entry.item.sectionId);
    }
    if (entry.kind === "section") {
      setNewItemSectionId(entry.section.id);
    }
  }

  function handleNewSectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newSectionTitle.trim()) return;

    const sectionId = ensureUniqueId(
      newSectionTitle,
      draft.sections.map((section) => section.id)
    );

    commitDraft({
      ...draft,
      sections: [
        ...draft.sections,
        {
          id: sectionId,
          title: newSectionTitle.trim(),
          description: newSectionDescription.trim(),
          visible: true,
          order: draft.sections.length,
          presentation: newSectionPresentation,
          collapsible: newSectionCollapsible,
          collapsedByDefault: newSectionCollapsedByDefault,
          source: "custom",
        },
      ],
    });

    if (newSectionPresentation === "horizontal") {
      setSelectedGroupId(PRODUCTIVITY_GROUP_ID);
      setSelectedEntryKey(`section:${sectionId}`);
      setNewItemSectionId(sectionId);
    } else {
      setSelectedGroupId(sectionId);
      setSelectedEntryKey(null);
      setNewItemSectionId(sectionId);
    }

    setNewSectionTitle("");
    setNewSectionDescription("");
    setNewSectionPresentation("vertical");
    setNewSectionCollapsible(true);
    setNewSectionCollapsedByDefault(false);
  }

  function handleNewItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newItemTitle.trim() || !activeTargetSectionId) return;
    if (!newItemManagedPage && !newItemHref.trim()) return;

    const itemId = ensureUniqueId(
      `${activeTargetSectionId}-${newItemTitle}`,
      draft.items.map((item) => item.id)
    );
    const href = newItemManagedPage
      ? buildManagedModuleHref(activeTargetSectionId, newItemTitle)
      : newItemHref.trim().startsWith("/")
        ? newItemHref.trim()
        : `/${newItemHref.trim()}`;

    commitDraft({
      ...draft,
      items: [
        ...draft.items,
        {
          id: itemId,
          sectionId: activeTargetSectionId,
          href,
          title: newItemTitle.trim(),
          description: "",
          icon: newItemIcon,
          minLevel: Math.max(0, Math.trunc(newItemMinLevel)),
          visible: true,
          order:
            draft.items.filter((item) => item.sectionId === activeTargetSectionId).length,
          aliases: [],
          source: "custom",
          pageType: newItemManagedPage ? "managed" : "built-in",
        },
      ],
    });

    const sectionIsHorizontal = draft.sections.find(
      (section) => section.id === activeTargetSectionId
    )?.presentation === "horizontal";

    setSelectedGroupId(sectionIsHorizontal ? PRODUCTIVITY_GROUP_ID : activeTargetSectionId);
    setSelectedEntryKey(sectionIsHorizontal ? `section:${activeTargetSectionId}` : `item:${itemId}`);
    setNewItemSectionId(activeTargetSectionId);
    setNewItemTitle("");
    setNewItemIcon("FolderTree");
    setNewItemIconQuery("");
    setNewItemMinLevel(0);
    setNewItemManagedPage(true);
    setNewItemHref("");
  }

  function renderItemEntry(entry: EditorItemEntry, nested = false) {
    const Icon = ICON_MAP[entry.icon];
    const isSelected = selectedEntry?.key === entry.key;

    return (
      <div
        key={entry.key}
        role="button"
        tabIndex={0}
        onClick={() => handleEntrySelect(entry)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleEntrySelect(entry);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => handleEntryDrop(entry)}
        data-testid={`editor-entry-${entry.key.replace(":", "-")}`}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
          nested && "bg-[color:var(--app-panel-bg)]",
          isSelected
            ? "border-transparent bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
            : "border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
        )}
      >
        <button
          type="button"
          draggable
          onDragStart={() =>
            setDragState({
              kind: "item",
              itemId: entry.item.id,
              sectionId: entry.item.sectionId,
            })
          }
          onDragEnd={() => setDragState(null)}
          className={cn(
            "rounded-lg p-1",
            isSelected
              ? "text-[color:var(--primary-foreground)]/80"
              : "text-[color:var(--muted-foreground)]"
          )}
          aria-label={`Mover ${entry.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            iconChipClass
          )}
        >
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{entry.title}</p>
          <p
            className={cn(
              "truncate text-xs",
              isSelected
                ? "text-[color:var(--primary-foreground)]/80"
                : "text-[color:var(--muted-foreground)]"
            )}
          >
            {entry.subtitle}
          </p>
        </div>

        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold",
            entry.visible
              ? isSelected
                ? "bg-white/15 text-[color:var(--primary-foreground)]"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
              : isSelected
                ? "bg-white/10 text-[color:var(--primary-foreground)]/80"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          )}
        >
          {entry.visible ? "Visible" : "Oculta"}
        </span>
      </div>
    );
  }

  function renderProductivitySectionEntry(entry: EditorSectionEntry) {
    const Icon = ICON_MAP[entry.icon];
    const sectionSelected =
      selectedEntry?.key === entry.key || selectedItemForConfig?.sectionId === entry.section.id;

    return (
      <div
        key={entry.key}
        className={cn(
          "rounded-2xl border p-3 transition-colors",
          sectionSelected
            ? "border-[color:var(--app-primary-strong)] bg-[color:var(--app-primary-soft)]/35"
            : "border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)]"
        )}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleEntrySelect(entry)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleEntrySelect(entry);
            }
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleEntryDrop(entry)}
          data-testid={`editor-entry-${entry.key.replace(":", "-")}`}
          className="flex items-center gap-3 rounded-2xl px-2 py-1 text-left"
        >
          <button
            type="button"
            draggable
            onDragStart={() => setDragState({ kind: "section", sectionId: entry.section.id })}
            onDragEnd={() => setDragState(null)}
            className={cn(
              "rounded-lg p-1",
              sectionSelected
                ? "text-[color:var(--app-primary-strong)]"
                : "text-[color:var(--muted-foreground)]"
            )}
            aria-label={`Mover ${entry.title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              iconChipClass
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
              {entry.title}
            </p>
            <p className="truncate text-xs text-[color:var(--muted-foreground)]">
              {entry.subtitle}
            </p>
          </div>

          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              entry.visible
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {entry.visible ? "Visible" : "Oculta"}
          </span>
        </div>

        <div className="mt-3 space-y-2 border-l border-[color:var(--app-panel-border)] pl-4">
          {entry.items.map((itemEntry) => renderItemEntry(itemEntry, true))}
          {entry.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--app-panel-border)] px-4 py-6 text-center text-sm text-[color:var(--muted-foreground)]">
              Esta opción horizontal no tiene módulos internos todavía.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderItemIconPicker(item: AppNavItem) {
    const PreviewIcon = ICON_MAP[item.icon] ?? ICON_MAP.FolderTree;

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
            Vista previa del ícono
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                iconChipClass
              )}
            >
              <PreviewIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                {item.title || "Sin título"}
              </p>
              <p className="truncate text-xs text-[color:var(--muted-foreground)]">
                {item.icon}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
            Buscar ícono
          </label>
          <input
            type="text"
            value={itemIconQuery}
            onChange={(event) => setItemIconQuery(event.target.value)}
            data-testid="item-icon-search"
            className={inputClass}
            placeholder="Ej. Settings, Users, Chart..."
          />
        </div>

        <div
          className="grid max-h-72 grid-cols-2 gap-2 overflow-auto rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-3"
          data-testid="item-icon-picker"
        >
          {filteredItemIcons.map((iconName) => {
            const Icon = ICON_MAP[iconName];
            const isActive = item.icon === iconName;

            return (
              <button
                key={iconName}
                type="button"
                onClick={() => updateItem(item.id, { icon: iconName })}
                data-testid={`item-icon-option-${slugifyNavigationToken(iconName)}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-transparent bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
                    : "border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isActive
                      ? "bg-white/15 text-[color:var(--primary-foreground)]"
                      : iconChipClass
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{iconName}</span>
              </button>
            );
          })}

          {filteredItemIcons.length === 0 ? (
            <div className="col-span-2 rounded-xl border border-dashed border-[color:var(--app-panel-border)] px-4 py-6 text-center text-sm text-[color:var(--muted-foreground)]">
              No hay íconos que coincidan con esa búsqueda.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderNewItemIconPicker() {
    const PreviewIcon = ICON_MAP[newItemIcon] ?? ICON_MAP.FolderTree;

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
            Vista previa del ícono
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                iconChipClass
              )}
            >
              <PreviewIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--foreground)]">
                {newItemTitle || "Nueva opción"}
              </p>
              <p className="truncate text-xs text-[color:var(--muted-foreground)]">
                {newItemIcon}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
            Buscar ícono
          </label>
          <input
            type="text"
            value={newItemIconQuery}
            onChange={(event) => setNewItemIconQuery(event.target.value)}
            data-testid="new-item-icon-search"
            className={inputClass}
            placeholder="Ej. Wrench, Users, Settings..."
          />
        </div>

        <div
          className="grid max-h-72 grid-cols-2 gap-2 overflow-auto rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-3"
          data-testid="new-item-icon-picker"
        >
          {filteredNewItemIcons.map((iconName) => {
            const Icon = ICON_MAP[iconName];
            const isActive = newItemIcon === iconName;

            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setNewItemIcon(iconName)}
                data-testid={`new-item-icon-option-${slugifyNavigationToken(iconName)}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                  isActive
                    ? "border-transparent bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
                    : "border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    isActive
                      ? "bg-white/15 text-[color:var(--primary-foreground)]"
                      : iconChipClass
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{iconName}</span>
              </button>
            );
          })}

          {filteredNewItemIcons.length === 0 ? (
            <div className="col-span-2 rounded-xl border border-dashed border-[color:var(--app-panel-border)] px-4 py-6 text-center text-sm text-[color:var(--muted-foreground)]">
              No hay íconos que coincidan con esa búsqueda.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!navigationLoaded) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--app-primary-strong)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--foreground)]">
              Menú Dinámico y Mantenimiento
            </h2>
          </div>
          <div className="flex max-w-4xl flex-1 flex-col gap-3 xl:items-end">
            {saveNotice ? (
              <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                {saveNotice}
              </span>
            ) : null}
            <div className="grid w-full gap-3 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto_auto_auto]">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  Template activo
                </label>
                <select
                  value={activeNavigationTemplateId}
                  onChange={(event) => handleTemplateChange(event.target.value)}
                  data-testid="navigation-template-select"
                  className={inputClass}
                >
                  {navigationTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
                  Guardar como nuevo
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(event) => setNewTemplateName(event.target.value)}
                  data-testid="new-navigation-template-name"
                  className={inputClass}
                  placeholder="Ej. Menú Gerencia"
                />
              </div>

              <button
                type="button"
                onClick={handleResetToBase}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--app-panel-border)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)] xl:self-end"
              >
                <RefreshCcw className="h-4 w-4" />
                Restaurar base
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={navigationSaving || !hasChanges}
                data-testid="save-navigation-config"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 xl:self-end"
              >
                {navigationSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar actual
              </button>

              <button
                type="button"
                onClick={handleSaveAsNewTemplate}
                disabled={navigationSaving || !newTemplateName.trim()}
                data-testid="save-navigation-template-as-new"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--app-primary-strong)] hover:bg-[color:var(--app-primary-soft)] disabled:opacity-50 xl:self-end"
              >
                {navigationSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Guardar como nuevo
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1fr_1.15fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[color:var(--foreground)]">
                Secciones
              </h3>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                Vista General, Análisis, Sistema de Productividad y secciones verticales adicionales.
              </p>
            </div>

            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleGroupSelect(group.id)}
                  data-testid={`editor-group-${group.id}`}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                    selectedGroup?.id === group.id
                      ? "border-transparent bg-[color:var(--app-primary-strong)] text-[color:var(--primary-foreground)]"
                      : "border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] text-[color:var(--foreground)] hover:bg-[color:var(--app-hover-bg)]"
                  )}
                >
                  <p className="text-sm font-semibold">{group.title}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      selectedGroup?.id === group.id
                        ? "text-[color:var(--primary-foreground)]/80"
                        : "text-[color:var(--muted-foreground)]"
                    )}
                  >
                    {group.entries.length} opciones
                  </p>
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleNewSectionSubmit}
            className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[color:var(--foreground)]">
                  Nueva sección
                </h3>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  Si es horizontal, aparecerá dentro de Sistema de Productividad.
                </p>
              </div>
              <Plus className="h-5 w-5 text-[color:var(--app-primary-strong)]" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Título
                </label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(event) => setNewSectionTitle(event.target.value)}
                  data-testid="new-section-title"
                  className={inputClass}
                  placeholder="Ej. Mantenimiento"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Descripción
                </label>
                <textarea
                  value={newSectionDescription}
                  onChange={(event) => setNewSectionDescription(event.target.value)}
                  data-testid="new-section-description"
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                    Presentación
                  </label>
                  <select
                    value={newSectionPresentation}
                    onChange={(event) =>
                      setNewSectionPresentation(
                        event.target.value as NavigationSectionPresentation
                      )
                    }
                    data-testid="new-section-presentation"
                    className={inputClass}
                  >
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </div>

                <div className="space-y-3 pt-6">
                  <label className="flex items-center gap-2 text-sm text-[color:var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={newSectionCollapsible}
                      onChange={(event) => setNewSectionCollapsible(event.target.checked)}
                    />
                    Expandible
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[color:var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={newSectionCollapsedByDefault}
                      onChange={(event) =>
                        setNewSectionCollapsedByDefault(event.target.checked)
                      }
                      disabled={!newSectionCollapsible}
                    />
                    Cerrada por defecto
                  </label>
                </div>
              </div>

              <button
                type="submit"
                data-testid="add-navigation-section"
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Crear sección
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[color:var(--foreground)]">
                Opciones del Menú
              </h3>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {selectedGroup
                  ? selectedGroup.kind === "productivity-system"
                    ? "Selecciona Productividad RH o Administración y después cualquiera de sus módulos horizontales."
                    : `Trabajando sobre ${selectedGroup.title}.`
                  : "Selecciona una sección para ver sus opciones."}
              </p>
            </div>

            <div className="space-y-2">
              {selectedGroup?.kind === "productivity-system"
                ? selectedGroup.entries.map((entry) => renderProductivitySectionEntry(entry))
                : selectedGroup?.entries.map((entry) => renderItemEntry(entry))}

              {selectedGroup && selectedGroup.entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--app-panel-border)] px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">
                  Esta sección no tiene opciones todavía.
                </div>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={handleNewItemSubmit}
            className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[color:var(--foreground)]">
                  Nueva opción
                </h3>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  Selecciona la sección destino. En Sistema de Productividad puedes apuntar
                  la nueva opción directamente a Productividad RH o Administración.
                </p>
              </div>
              <Plus className="h-5 w-5 text-[color:var(--app-primary-strong)]" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Sección destino
                </label>
                <select
                  value={activeTargetSectionId}
                  onChange={(event) => setNewItemSectionId(event.target.value)}
                  data-testid="new-item-section"
                  className={inputClass}
                >
                  {availableSectionOptions.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Título
                </label>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(event) => setNewItemTitle(event.target.value)}
                  data-testid="new-item-title"
                  className={inputClass}
                  placeholder="Ej. Checklist Diario"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                  Ícono
                </label>
                {renderNewItemIconPicker()}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                    Nivel mínimo
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={newItemMinLevel}
                    onChange={(event) => setNewItemMinLevel(Number(event.target.value))}
                    data-testid="new-item-min-level"
                    className={inputClass}
                  />
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] px-3 py-2 text-sm text-[color:var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={newItemManagedPage}
                    onChange={(event) => setNewItemManagedPage(event.target.checked)}
                    data-testid="new-item-managed"
                  />
                  Página managed
                </label>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                  Ruta
                </label>
                <input
                  type="text"
                  value={
                    newItemManagedPage
                      ? buildManagedModuleHref(
                          activeTargetSectionId || "nuevo-modulo",
                          newItemTitle || "nuevo-modulo"
                        )
                      : newItemHref
                  }
                  onChange={(event) => setNewItemHref(event.target.value)}
                  readOnly={newItemManagedPage}
                  data-testid="new-item-href"
                  className={cn(inputClass, newItemManagedPage && "opacity-70")}
                />
              </div>

              <button
                type="submit"
                data-testid="add-navigation-item"
                disabled={!activeTargetSectionId}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Crear opción
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-[color:var(--foreground)]">
                Configuración
              </h3>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                {selectedItemForConfig
                  ? `Ajustes de la opción ${selectedItemForConfig.title}.`
                  : selectedSectionForConfig
                    ? `Ajustes de la sección ${selectedSectionForConfig.title}.`
                    : "Selecciona una opción en la columna central para editar sus detalles."}
              </p>
            </div>

            {selectedItemForConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                    Título
                  </label>
                  <input
                    type="text"
                    value={selectedItemForConfig.title}
                    onChange={(event) =>
                      updateItem(selectedItemForConfig.id, { title: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                    Descripción
                  </label>
                  <textarea
                    value={selectedItemForConfig.description ?? ""}
                    onChange={(event) =>
                      updateItem(selectedItemForConfig.id, { description: event.target.value })
                    }
                    rows={3}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                    Ruta
                  </label>
                  <input
                    type="text"
                    value={selectedItemForConfig.href}
                    onChange={(event) =>
                      updateItem(selectedItemForConfig.id, { href: event.target.value })
                    }
                    readOnly={
                      selectedItemForConfig.pageType === "managed" ||
                      selectedItemForConfig.source === "system"
                    }
                    className={cn(
                      inputClass,
                      (selectedItemForConfig.pageType === "managed" ||
                        selectedItemForConfig.source === "system") &&
                        "opacity-70"
                    )}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
                    Ícono del menú
                  </label>
                  {renderItemIconPicker(selectedItemForConfig)}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                      Nivel mínimo
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={9}
                      value={selectedItemForConfig.minLevel}
                      onChange={(event) =>
                        updateItem(selectedItemForConfig.id, {
                          minLevel: Number(event.target.value),
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                      Visibilidad
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(selectedItemForConfig.id, {
                          visible: !selectedItemForConfig.visible,
                        })
                      }
                      className={cn(
                        "inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                        selectedItemForConfig.visible
                          ? "border-transparent bg-emerald-600 text-white"
                          : "border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] text-[color:var(--foreground)]"
                      )}
                    >
                      {selectedItemForConfig.visible ? "Visible" : "Oculta"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-4 text-sm text-[color:var(--muted-foreground)]">
                  {selectedItemForConfig.pageType === "managed"
                    ? "La ruta es managed y se genera automáticamente bajo /modulos/..."
                    : "La ruta es fija y puedes modificarla si la opción es personalizada."}
                </div>

                <button
                  type="button"
                  onClick={() => deleteItem(selectedItemForConfig.id)}
                  disabled={selectedItemForConfig.source === "system"}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-[color:var(--muted-foreground)] disabled:hover:bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar opción
                </button>
              </div>
            ) : selectedSectionForConfig ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                    Título
                  </label>
                  <input
                    type="text"
                    value={selectedSectionForConfig.title}
                    onChange={(event) =>
                      updateSection(selectedSectionForConfig.id, {
                        title: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                    Descripción
                  </label>
                  <textarea
                    value={selectedSectionForConfig.description}
                    onChange={(event) =>
                      updateSection(selectedSectionForConfig.id, {
                        description: event.target.value,
                      })
                    }
                    rows={3}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                      Presentación
                    </label>
                    <select
                      value={selectedSectionForConfig.presentation}
                      onChange={(event) =>
                        updateSection(selectedSectionForConfig.id, {
                          presentation: event.target.value as NavigationSectionPresentation,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[color:var(--foreground)]">
                      Visibilidad
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        updateSection(selectedSectionForConfig.id, {
                          visible: !selectedSectionForConfig.visible,
                        })
                      }
                      className={cn(
                        "inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                        selectedSectionForConfig.visible
                          ? "border-transparent bg-emerald-600 text-white"
                          : "border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] text-[color:var(--foreground)]"
                      )}
                    >
                      {selectedSectionForConfig.visible ? "Visible" : "Oculta"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] px-3 py-2 text-sm text-[color:var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={selectedSectionForConfig.collapsible}
                      onChange={(event) =>
                        updateSection(selectedSectionForConfig.id, {
                          collapsible: event.target.checked,
                        })
                      }
                    />
                    Expandible
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] px-3 py-2 text-sm text-[color:var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={selectedSectionForConfig.collapsedByDefault}
                      onChange={(event) =>
                        updateSection(selectedSectionForConfig.id, {
                          collapsedByDefault: event.target.checked,
                        })
                      }
                      disabled={!selectedSectionForConfig.collapsible}
                    />
                    Cerrada por defecto
                  </label>
                </div>

                <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] p-4 text-sm text-[color:var(--muted-foreground)]">
                  {selectedSectionForConfig.presentation === "horizontal"
                    ? "Esta sección vive dentro de Sistema de Productividad y se abre desde el lateral."
                    : "Esta sección aparece como bloque vertical dentro del menú lateral."}
                </div>

                <button
                  type="button"
                  onClick={() => deleteSection(selectedSectionForConfig.id)}
                  disabled={selectedSectionForConfig.source === "system"}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-[color:var(--muted-foreground)] disabled:hover:bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar sección
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[color:var(--app-panel-border)] px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">
                Selecciona una opción en la columna central para editar ruta, descripción, ícono y visibilidad.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
