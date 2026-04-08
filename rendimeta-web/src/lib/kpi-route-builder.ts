import { prisma } from "@/lib/prisma";
import {
  parseFilters,
  buildKpiWhere,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import type { KpiCategory } from "@/types";

// Map category to the Prisma model delegate name
const MODEL_MAP: Record<KpiCategory, keyof typeof prisma> = {
  operational: "operationalKpi",
  financial: "financialKpi",
  productivity: "productivityKpi",
  inventory: "inventoryKpi",
  customer: "customerKpi",
  compliance: "complianceKpi",
  environmental: "environmentalKpi",
};

/**
 * Creates a GET handler for a specific KPI category route.
 * Returns daily records with station/city/state grouping support.
 */
export function createKpiCategoryHandler(category: KpiCategory) {
  return async function GET(request: Request) {
    try {
      const url = new URL(request.url);
      const filters = parseFilters(url);
      const where = buildKpiWhere(filters);

      const modelKey = MODEL_MAP[category];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = prisma[modelKey] as any;

      const records = await model.findMany({
        where,
        orderBy: { date: "asc" },
        include: {
          station: {
            select: {
              id: true,
              name: true,
              city: {
                select: {
                  id: true,
                  name: true,
                  state: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // If groupBy is specified, aggregate per group per date
      const { groupBy } = filters;

      if (!groupBy) {
        // Return raw data points (one per station per date)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = records.map((r: any) => {
          const { id, stationId, station, createdAt, ...kpiFields } = r;
          return {
            ...kpiFields,
            date:
              kpiFields.date instanceof Date
                ? kpiFields.date.toISOString().slice(0, 10)
                : kpiFields.date,
            stationId,
            stationName: station.name,
            cityName: station.city.name,
            stateName: station.city.state.name,
          };
        });
        return jsonResponse({ data });
      }

      // Group + average numeric fields by groupBy + date
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const groups = new Map<string, any[]>();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of records as any[]) {
        let groupId: string;
        let groupName: string;

        switch (groupBy) {
          case "state":
            groupId = r.station.city.state.id;
            groupName = r.station.city.state.name;
            break;
          case "city":
            groupId = r.station.city.id;
            groupName = r.station.city.name;
            break;
          default:
            groupId = r.station.id;
            groupName = r.station.name;
        }

        const dateStr =
          r.date instanceof Date
            ? r.date.toISOString().slice(0, 10)
            : r.date;
        const key = `${groupId}__${dateStr}`;

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push({
          ...r,
          _groupId: groupId,
          _groupName: groupName,
          _dateStr: dateStr,
        });
      }

      const aggregated = Array.from(groups.entries()).map(
        ([, entries]) => {
          const first = entries[0];
          const count = entries.length;

          // Get numeric fields (exclude non-numeric and meta fields)
          const excludeKeys = new Set([
            "id",
            "stationId",
            "station",
            "createdAt",
            "date",
            "_groupId",
            "_groupName",
            "_dateStr",
          ]);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const averaged: Record<string, any> = {
            date: first._dateStr,
            groupId: first._groupId,
            groupName: first._groupName,
          };

          for (const key of Object.keys(first)) {
            if (excludeKeys.has(key)) continue;
            if (typeof first[key] !== "number") continue;

            const sum = entries.reduce(
              (acc: number, e: Record<string, number>) => acc + (e[key] ?? 0),
              0
            );

            // Sum fields that represent totals; average fields that represent rates/percentages
            const isSumField =
              key.includes("Liters") ||
              key.includes("Mxn") ||
              key.includes("Kwh") ||
              key.includes("Kg") ||
              key.includes("Hours") ||
              key.includes("Traffic") ||
              key.includes("Transactions") ||
              key.includes("Incidents") ||
              key.includes("Tasks") ||
              key.includes("Passed") ||
              key.includes("Total") ||
              key.includes("Min");

            averaged[key] =
              Math.round((isSumField ? sum : sum / count) * 100) / 100;
          }

          return averaged;
        }
      );

      // Sort by date then groupName
      aggregated.sort((a, b) => {
        const d = a.date.localeCompare(b.date);
        if (d !== 0) return d;
        return a.groupName.localeCompare(b.groupName);
      });

      return jsonResponse({ data: aggregated });
    } catch (error) {
      console.error(`GET /api/kpis/${category} error:`, error);
      return errorResponse(`Error al obtener KPIs de ${category}`, 500);
    }
  };
}
