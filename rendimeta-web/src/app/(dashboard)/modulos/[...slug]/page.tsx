import { notFound } from "next/navigation";
import { getNavigationConfig } from "@/lib/navigation-store";
import { findNavigationItemByPath, getEditorSections } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function ManagedModulePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const pathname = `/${["modulos", ...slug].join("/")}`;
  const navigationState = await getNavigationConfig();
  const item = findNavigationItemByPath(navigationState.config, pathname);

  if (!item || item.pageType !== "managed") {
    notFound();
  }

  const section = getEditorSections(navigationState.config).find(
    (entry) => entry.id === item.sectionId
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-6 py-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
          Módulo Managed
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[color:var(--foreground)]">
          {item.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[color:var(--muted-foreground)]">
          Esta pantalla fue creada desde la configuración del menú. Ya está enlazada con
          la navegación y lista para que implementemos aquí la lógica del módulo.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <InfoCard label="Sección" value={section?.title ?? item.sectionId} />
        <InfoCard label="Ruta" value={item.href} />
        <InfoCard label="Nivel mínimo" value={`Nivel ${item.minLevel}`} />
      </div>

      <div className="rounded-3xl border border-dashed border-[color:var(--app-panel-border)] bg-[color:var(--app-subtle-bg)] px-6 py-8">
        <h2 className="text-lg font-bold text-[color:var(--foreground)]">
          Siguiente paso recomendado
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
          Podemos convertir este módulo managed en una pantalla operativa real conservando
          el mismo enlace del menú, sus permisos y su ícono.
        </p>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
