"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { CHART_PALETTE } from "@/lib/constants";

// Leaflet types - loaded dynamically to avoid SSR issues
type LType = typeof import("leaflet");
let L: LType | null = null;

interface StationPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  stateCode: string;
  revenue?: number;
  pumpCount?: number;
  hasConvenienceStore?: boolean;
}

interface LeafletMapProps {
  stations: StationPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

const STATE_COLORS: Record<string, string> = {
  BC: CHART_PALETTE[0],
  CHIH: CHART_PALETTE[1],
  NAY: CHART_PALETTE[2],
  SIN: CHART_PALETTE[3],
  SON: CHART_PALETTE[4],
};

const STATE_LABELS: Record<string, string> = {
  BC: "Baja California",
  CHIH: "Chihuahua",
  NAY: "Nayarit",
  SIN: "Sinaloa",
  SON: "Sonora",
};

function createMarkerIcon(leaflet: LType, color: string, size: number) {
  return leaflet.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function LeafletMap({
  stations,
  title,
  subtitle,
  height = 500,
  className,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [activeState, setActiveState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateBoundsRef = useRef<Map<string, any>>(new Map());

  const flyToState = useCallback((stateCode: string | null) => {
    const map = mapInstanceRef.current;
    if (!map || !L) return;

    setActiveState(stateCode);

    if (!stateCode) {
      const lats = stations.map((s) => s.latitude);
      const lngs = stations.map((s) => s.longitude);
      const allBounds = L.latLngBounds(
        [Math.min(...lats) - 0.2, Math.min(...lngs) - 0.8],
        [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.3]
      );
      map.flyToBounds(allBounds, { duration: 0.8, padding: [20, 20] });
      return;
    }

    const bounds = stateBoundsRef.current.get(stateCode);
    if (bounds) {
      map.flyToBounds(bounds, { duration: 0.8, padding: [40, 40], maxZoom: 13 });
    }
  }, [stations]);

  useEffect(() => {
    if (!mapRef.current || stations.length === 0) return;

    let cancelled = false;

    async function initMap() {
      // Dynamic import of leaflet (client-only)
      const leaflet = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      L = leaflet.default || leaflet;

      if (cancelled || !mapRef.current) return;

      // Clean up previous map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const lats = stations.map((s) => s.latitude);
      const lngs = stations.map((s) => s.longitude);
      const bounds = L.latLngBounds(
        [Math.min(...lats) - 0.2, Math.min(...lngs) - 0.8],
        [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.3]
      );

      // Per-state bounds
      const stBounds = new Map();
      const stateStationsMap = new Map<string, StationPoint[]>();
      for (const s of stations) {
        if (!stateStationsMap.has(s.stateCode)) stateStationsMap.set(s.stateCode, []);
        stateStationsMap.get(s.stateCode)!.push(s);
      }
      for (const [code, sts] of stateStationsMap.entries()) {
        const sLats = sts.map((s) => s.latitude);
        const sLngs = sts.map((s) => s.longitude);
        stBounds.set(
          code,
          L.latLngBounds(
            [Math.min(...sLats) - 0.1, Math.min(...sLngs) - 0.1],
            [Math.max(...sLats) + 0.1, Math.max(...sLngs) + 0.1]
          )
        );
      }
      stateBoundsRef.current = stBounds;

      // Revenue range
      const revenues = stations.map((s) => s.revenue || 0).filter((r) => r > 0);
      const maxRevenue = revenues.length > 0 ? Math.max(...revenues) : 1;
      const minRevenue = revenues.length > 0 ? Math.min(...revenues) : 0;

      const map = L.map(mapRef.current!, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).fitBounds(bounds);

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 18,
      }).addTo(map);

      for (const station of stations) {
        const color = STATE_COLORS[station.stateCode] || CHART_PALETTE[5];
        const size =
          station.revenue && maxRevenue > minRevenue
            ? 12 + ((station.revenue - minRevenue) / (maxRevenue - minRevenue)) * 18
            : 16;

        const marker = L.marker([station.latitude, station.longitude], {
          icon: createMarkerIcon(L, color, size),
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-size:13px;min-width:200px;line-height:1.5">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#111827">${station.name}</div>
            <div style="color:#6b7280;margin-bottom:6px">${station.city}, ${station.state}</div>
            ${station.revenue ? `<div style="font-weight:600;color:#059669;margin-bottom:2px">Ingreso: ${formatCurrency(station.revenue)}</div>` : ""}
            ${station.pumpCount ? `<div style="color:#6b7280">${station.pumpCount} bombas</div>` : ""}
            ${station.hasConvenienceStore ? `<div style="color:#6b7280">Tienda de conveniencia</div>` : ""}
          </div>
        `);
      }

      setReady(true);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stations]);

  if (stations.length === 0) {
    return (
      <div className={cn("rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950", className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">No hay estaciones con coordenadas disponibles.</p>
      </div>
    );
  }

  // Get unique states from stations
  const uniqueStates = Array.from(new Set(stations.map((s) => s.stateCode))).sort();
  const stationCountByState = new Map<string, number>();
  for (const s of stations) {
    stationCountByState.set(s.stateCode, (stationCountByState.get(s.stateCode) || 0) + 1);
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950", className)}>
      {(title || subtitle) && (
        <div className="px-6 pt-5 pb-2">
          {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}

      {/* State navigation buttons */}
      <div className={cn("flex flex-wrap items-center gap-2 px-4 pb-2", !title && !subtitle ? "pt-3" : "")}>
        <button
          onClick={() => flyToState(null)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            activeState === null
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          )}
        >
          Todos
        </button>
        {uniqueStates.map((code) => {
          const color = STATE_COLORS[code] || CHART_PALETTE[5];
          const count = stationCountByState.get(code) || 0;
          return (
            <button
              key={code}
              onClick={() => flyToState(code)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                activeState === code
                  ? "text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
              style={activeState === code ? { backgroundColor: color } : undefined}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full border border-white/50"
                style={{ backgroundColor: color }}
              />
              {STATE_LABELS[code] || code}
              <span className={cn(
                "rounded-full px-1.5 py-0 text-[10px] font-bold",
                activeState === code
                  ? "bg-white/25 text-white"
                  : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={mapRef} style={{ height }} className="z-0" />
    </div>
  );
}
