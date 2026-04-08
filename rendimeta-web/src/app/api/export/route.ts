import { prisma } from "@/lib/prisma";
import { parseFilters, buildKpiWhere, errorResponse } from "@/lib/api-helpers";
import type { KpiCategory } from "@/types";
import ExcelJS from "exceljs";

const MODEL_MAP: Record<KpiCategory, keyof typeof prisma> = {
  operational: "operationalKpi",
  financial: "financialKpi",
  productivity: "productivityKpi",
  inventory: "inventoryKpi",
  customer: "customerKpi",
  compliance: "complianceKpi",
  environmental: "environmentalKpi",
};

const CATEGORY_LABELS: Record<KpiCategory, string> = {
  operational: "Operativos",
  financial: "Financieros",
  productivity: "Productividad",
  inventory: "Inventario",
  customer: "Clientes",
  compliance: "Cumplimiento",
  environmental: "Ambientales",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kpiCategory, format: exportFormat = "xlsx" } = body as {
      kpiCategory: KpiCategory;
      format?: "xlsx";
    };

    if (!kpiCategory || !MODEL_MAP[kpiCategory]) {
      return errorResponse("Se requiere kpiCategory válida", 400);
    }

    const url = new URL(request.url);
    // Allow filters to be passed in body or query
    const filters = parseFilters(url);
    if (body.stateId) (filters as Record<string, string | undefined>).stateId = body.stateId;
    if (body.cityId) (filters as Record<string, string | undefined>).cityId = body.cityId;
    if (body.stationId) (filters as Record<string, string | undefined>).stationId = body.stationId;
    if (body.from) (filters as Record<string, string | undefined>).from = body.from;
    if (body.to) (filters as Record<string, string | undefined>).to = body.to;

    const where = buildKpiWhere(filters);
    const modelKey = MODEL_MAP[kpiCategory];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = prisma[modelKey] as any;

    const records = await model.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        station: {
          select: {
            name: true,
            city: {
              select: {
                name: true,
                state: { select: { name: true } },
              },
            },
          },
        },
      },
      take: 10000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Rendichicas Dashboard";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`KPIs ${CATEGORY_LABELS[kpiCategory]}`);

    // Build columns from first record
    if (records.length === 0) {
      sheet.addRow(["Sin datos para los filtros seleccionados"]);
    } else {
      // Exclude meta fields
      const excludeKeys = new Set(["id", "stationId", "station", "createdAt"]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstRecord = records[0] as any;
      const dataKeys = Object.keys(firstRecord).filter(
        (k) => !excludeKeys.has(k)
      );

      // Add header columns
      const columns = [
        "Estación",
        "Ciudad",
        "Estado",
        ...dataKeys.map((k) => {
          if (k === "date") return "Fecha";
          return k;
        }),
      ];

      const headerRow = sheet.addRow(columns);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE11D48" },
      };
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

      // Add data rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const record of records as any[]) {
        const row = [
          record.station?.name ?? "",
          record.station?.city?.name ?? "",
          record.station?.city?.state?.name ?? "",
          ...dataKeys.map((k) => {
            const val = record[k];
            if (val instanceof Date) return val.toISOString().slice(0, 10);
            return val;
          }),
        ];
        sheet.addRow(row);
      }

      // Auto-fit columns
      sheet.columns.forEach((col) => {
        let maxLen = 12;
        col.eachCell?.({ includeEmpty: false }, (cell) => {
          const len = String(cell.value ?? "").length;
          if (len > maxLen) maxLen = Math.min(len, 40);
        });
        col.width = maxLen + 2;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="kpis-${kpiCategory}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("POST /api/export error:", error);
    return errorResponse("Error al exportar datos", 500);
  }
}
