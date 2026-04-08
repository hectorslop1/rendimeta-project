import { prisma } from "@/lib/prisma";
import {
  parseFilters,
  buildKpiWhere,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = parseFilters(url);
    const where = buildKpiWhere(filters);

    // Geographic summary
    const [stateCount, cityCount, stationCount] = await Promise.all([
      prisma.state.count(),
      prisma.city.count(),
      prisma.station.count({ where: { isActive: true } }),
    ]);

    // Station rankings by revenue
    const financialData = await prisma.financialKpi.findMany({
      where,
      select: {
        stationId: true,
        totalRevenueMxn: true,
        fuelGrossMarginPct: true,
        station: {
          select: {
            name: true,
            city: {
              select: {
                name: true,
                state: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
    });

    // Aggregate per station
    const stationMap = new Map<
      string,
      {
        name: string;
        city: string;
        state: string;
        stateCode: string;
        totalRevenue: number;
        marginSum: number;
        count: number;
      }
    >();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of financialData as any[]) {
      const id = row.stationId as string;
      if (!stationMap.has(id)) {
        stationMap.set(id, {
          name: row.station.name,
          city: row.station.city.name,
          state: row.station.city.state.name,
          stateCode: row.station.city.state.code,
          totalRevenue: 0,
          marginSum: 0,
          count: 0,
        });
      }
      const entry = stationMap.get(id)!;
      entry.totalRevenue += row.totalRevenueMxn ?? 0;
      entry.marginSum += row.fuelGrossMarginPct ?? 0;
      entry.count++;
    }

    const ranked = Array.from(stationMap.entries())
      .map(([id, s]) => ({
        id,
        name: s.name,
        city: s.city,
        state: s.state,
        stateCode: s.stateCode,
        totalRevenue: Math.round(s.totalRevenue * 100) / 100,
        avgMargin: Math.round((s.marginSum / s.count) * 100) / 100,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // City rankings by revenue
    const cityMap = new Map<
      string,
      { name: string; state: string; stateCode: string; totalRevenue: number; stationCount: number }
    >();

    for (const s of ranked) {
      const key = `${s.city}-${s.stateCode}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          name: s.city,
          state: s.state,
          stateCode: s.stateCode,
          totalRevenue: 0,
          stationCount: 0,
        });
      }
      const entry = cityMap.get(key)!;
      entry.totalRevenue += s.totalRevenue;
      entry.stationCount++;
    }

    const cityRankings = Array.from(cityMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return jsonResponse({
      data: {
        geographic: {
          states: stateCount,
          cities: cityCount,
          stations: stationCount,
        },
        top5: ranked.slice(0, 5),
        bottom5: ranked.slice(-5).reverse(),
        allStations: ranked,
        cityRankings,
      },
    });
  } catch (error) {
    console.error("GET /api/kpis/rankings error:", error);
    return errorResponse("Error al obtener rankings", 500);
  }
}
