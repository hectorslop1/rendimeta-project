import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

type ShiftName = "Matutino" | "Vespertino" | "Nocturno";

function getShiftForHour(hour: number): ShiftName {
  if (hour >= 6 && hour <= 13) return "Matutino";
  if (hour >= 14 && hour <= 21) return "Vespertino";
  return "Nocturno"; // 22-5
}

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId") || undefined;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (stationId) where.stationId = stationId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const summaries = await prisma.hourlySalesSummary.findMany({ where });

    // Aggregate by shift
    const shiftData: Record<
      ShiftName,
      {
        fulfillmentSum: number;
        fulfillmentCount: number;
        totalRevenue: number;
        employees: Set<string>;
      }
    > = {
      Matutino: { fulfillmentSum: 0, fulfillmentCount: 0, totalRevenue: 0, employees: new Set() },
      Vespertino: { fulfillmentSum: 0, fulfillmentCount: 0, totalRevenue: 0, employees: new Set() },
      Nocturno: { fulfillmentSum: 0, fulfillmentCount: 0, totalRevenue: 0, employees: new Set() },
    };

    for (const s of summaries) {
      const shift = getShiftForHour(s.hour);
      const data = shiftData[shift];
      data.fulfillmentSum += s.fulfillmentPct;
      data.fulfillmentCount++;
      data.totalRevenue += s.totalRevenue;
      data.employees.add(s.employeeId);
    }

    const result = (["Matutino", "Vespertino", "Nocturno"] as ShiftName[]).map(
      (shift) => {
        const data = shiftData[shift];
        return {
          shift,
          avgFulfillmentPct:
            data.fulfillmentCount > 0
              ? Math.round((data.fulfillmentSum / data.fulfillmentCount) * 100) / 100
              : 0,
          totalRevenue: Math.round(data.totalRevenue * 100) / 100,
          employeeCount: data.employees.size,
        };
      }
    );

    return jsonResponse({ data: result });
  } catch (error) {
    console.error("GET /api/hr/dashboard/shift-analysis error:", error);
    return errorResponse("Error al obtener análisis por turno", 500);
  }
}
