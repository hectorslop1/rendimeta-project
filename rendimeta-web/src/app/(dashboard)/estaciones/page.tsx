"use client";

import { useState, useMemo } from "react";
import { useStations, useRankings } from "@/hooks/use-kpi-data";
import { Skeleton } from "@/components/ui/skeleton";
import { LeafletMap } from "@/components/charts/leaflet-map";
import { TreemapChart } from "@/components/charts/treemap-chart";
import { MapPin, Fuel, Store, Map as MapIcon, List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "map" | "table" | "cards";

export default function EstacionesPage() {
  const { data: stations, isLoading, error } = useStations();
  const { data: rankings } = useRankings();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("map");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = stations?.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  // Build map data with revenue
  const mapStations = useMemo(() => {
    if (!stations) return [];
    const revenueMap = new Map<string, number>();
    if (rankings) {
      for (const s of [...(rankings.top5 || []), ...(rankings.bottom5 || [])]) {
        revenueMap.set(s.id, s.totalRevenue);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return filtered.filter((s: any) => s.latitude && s.longitude).map((s: any) => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city?.name || "",
      state: s.city?.state?.name || "",
      stateCode: s.city?.state?.code || "",
      revenue: revenueMap.get(s.id) || 0,
      pumpCount: s.pumpCount,
      hasConvenienceStore: s.hasConvenienceStore,
    }));
  }, [stations, rankings, filtered]);

  // Build treemap data: State → City → Station hierarchy with revenue
  const treemapData = useMemo(() => {
    if (!rankings?.allStations) return [];

    // Build hierarchy: State → City → Station
    const stateMap = new Map<string, {
      revenue: number;
      count: number;
      cities: Map<string, { revenue: number; count: number; stations: { name: string; revenue: number }[] }>;
    }>();

    for (const station of rankings.allStations) {
      if (!stateMap.has(station.state)) {
        stateMap.set(station.state, { revenue: 0, count: 0, cities: new Map() });
      }
      const stateEntry = stateMap.get(station.state)!;
      stateEntry.revenue += station.totalRevenue;
      stateEntry.count++;

      if (!stateEntry.cities.has(station.city)) {
        stateEntry.cities.set(station.city, { revenue: 0, count: 0, stations: [] });
      }
      const cityEntry = stateEntry.cities.get(station.city)!;
      cityEntry.revenue += station.totalRevenue;
      cityEntry.count++;
      cityEntry.stations.push({ name: station.name, revenue: station.totalRevenue });
    }

    return Array.from(stateMap.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([state, data]) => ({
        name: state,
        value: data.revenue,
        stationCount: data.count,
        children: Array.from(data.cities.entries())
          .sort(([, a], [, b]) => b.revenue - a.revenue)
          .map(([city, cityData]) => ({
            name: city,
            value: cityData.revenue,
            stationCount: cityData.count,
            children: cityData.stations
              .sort((a, b) => b.revenue - a.revenue)
              .map((s) => ({
                name: s.name,
                value: s.revenue,
              })),
          })),
      }));
  }, [rankings]);

  const viewButtons: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "map", label: "Mapa", icon: <MapIcon className="h-4 w-4" /> },
    { key: "table", label: "Tabla", icon: <List className="h-4 w-4" /> },
    { key: "cards", label: "Tarjetas", icon: <LayoutGrid className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header row: title + search + view toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Estaciones
          </h1>
        </div>

        <input
          type="text"
          placeholder="Buscar estación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
        />

        {!isLoading && (
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {filtered.length} estacion{filtered.length !== 1 ? "es" : ""}
          </span>
        )}

        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
          {viewButtons.map((btn, i) => (
            <button
              key={btn.key}
              onClick={() => setView(btn.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                i === 0 && "rounded-l-lg",
                i === viewButtons.length - 1 && "rounded-r-lg",
                view === btn.key
                  ? "bg-rose-600 text-white dark:bg-rose-500"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              title={`Vista ${btn.label}`}
            >
              {btn.icon}
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Error al cargar estaciones: {error.message}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-[750px] w-full rounded-xl" />
      ) : view === "map" ? (
        <LeafletMap
          stations={mapStations}
          height={750}
        />
      ) : view === "table" ? (
        <div className="space-y-3">
          {/* Treemap */}
          {treemapData.length > 0 && (
            <TreemapChart
              data={treemapData}
              height={480}
            />
          )}

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Estación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Ciudad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Bombas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Tanques
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Capacidad (L)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Tienda
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Dirección
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {filtered.map((station: any, idx: number) => (
                  <tr
                    key={station.id}
                    className={cn(
                      "transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      idx % 2 === 1 && "bg-gray-50/70 dark:bg-gray-900/30"
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {station.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {station.city?.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {station.city?.state?.code}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {station.pumpCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {station.tankCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-300">
                      {new Intl.NumberFormat("es-MX").format(station.tankCapacityLiters)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {station.hasConvenienceStore ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <Store className="h-3 w-3" />
                          Sí
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="max-w-[250px] truncate px-4 py-3 text-sm text-gray-500 dark:text-gray-400" title={station.address}>
                      {station.address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron estaciones
              {search ? ` que coincidan con "${search}"` : ""}
            </div>
          )}
        </div>
        </div>
      ) : (
        /* Cards view */
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filtered.map((station: any) => (
            <div
              key={station.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {station.name}
                </h3>
                {station.hasConvenienceStore && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <Store className="h-3 w-3" />
                    Tienda
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <p>{station.address}</p>
                    {station.neighborhood && (
                      <p className="text-gray-500 dark:text-gray-400">
                        {station.neighborhood}
                        {station.postalCode ? `, CP ${station.postalCode}` : ""}
                      </p>
                    )}
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {station.city?.name}
                      {station.city?.state?.name ? `, ${station.city.state.name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t border-gray-100 pt-2 dark:border-gray-700">
                  <div className="flex items-center gap-1.5">
                    <Fuel className="h-4 w-4 text-gray-400" />
                    <span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {station.pumpCount}
                      </span>{" "}
                      bomba{station.pumpCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500">|</div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {station.tankCount}
                    </span>{" "}
                    tanque{station.tankCount !== 1 ? "s" : ""}
                  </div>
                  {station.tankCapacityLiters > 0 && (
                    <>
                      <div className="text-gray-400 dark:text-gray-500">|</div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Intl.NumberFormat("es-MX").format(station.tankCapacityLiters)}
                        </span>{" "}
                        L cap.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron estaciones
              {search ? ` que coincidan con "${search}"` : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
