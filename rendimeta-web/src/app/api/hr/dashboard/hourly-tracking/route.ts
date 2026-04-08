import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId");
    const dateStr = url.searchParams.get("date");

    if (!stationId || !dateStr) {
      return errorResponse("stationId y date son requeridos", 400);
    }

    const date = new Date(dateStr);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Get active employees at the station
    const employees = await prisma.employee.findMany({
      where: { stationId, status: "ACTIVE" },
      select: { id: true, firstName: true, lastName: true, employeeNumber: true },
      orderBy: { firstName: "asc" },
    });

    const employeeIds = employees.map((e) => e.id);

    // Get hourly summaries for the date and month in parallel
    const [hourlySummaries, monthSummaries] = await Promise.all([
      prisma.hourlySalesSummary.findMany({
        where: { stationId, date, employeeId: { in: employeeIds } },
      }),
      prisma.hourlySalesSummary.findMany({
        where: {
          stationId,
          date: { gte: monthStart, lte: monthEnd },
          employeeId: { in: employeeIds },
        },
      }),
    ]);

    // Index hourly summaries by employee+hour
    const hourlyMap = new Map<string, typeof hourlySummaries[number]>();
    for (const s of hourlySummaries) {
      hourlyMap.set(`${s.employeeId}_${s.hour}`, s);
    }

    // Month accumulated per employee
    const monthAccMap = new Map<string, { units: number; revenue: number; quota: number }>();
    for (const s of monthSummaries) {
      const acc = monthAccMap.get(s.employeeId) || { units: 0, revenue: 0, quota: 0 };
      acc.units += s.totalUnits;
      acc.revenue += s.totalRevenue;
      acc.quota += s.quotaTarget;
      monthAccMap.set(s.employeeId, acc);
    }

    // Build employee rows
    const rows = employees.map((emp) => {
      const hours = HOURS.map((hour) => {
        const cell = hourlyMap.get(`${emp.id}_${hour}`);
        return {
          hour,
          totalUnits: cell?.totalUnits ?? 0,
          totalRevenue: cell?.totalRevenue ?? 0,
          quotaTarget: cell?.quotaTarget ?? 0,
          fulfillmentPct: cell?.fulfillmentPct ?? 0,
        };
      });

      const dayTotal = hours.reduce(
        (acc, h) => ({
          units: acc.units + h.totalUnits,
          revenue: acc.revenue + h.totalRevenue,
        }),
        { units: 0, revenue: 0 }
      );

      const monthAcc = monthAccMap.get(emp.id) || { units: 0, revenue: 0, quota: 0 };
      const monthFulfillmentPct =
        monthAcc.quota > 0
          ? Math.round((monthAcc.revenue / monthAcc.quota) * 10000) / 100
          : 0;

      return {
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        hours,
        dayTotal,
        monthAccumulated: { units: monthAcc.units, revenue: monthAcc.revenue },
        monthFulfillmentPct,
      };
    });

    // Station footer: totals per hour
    const stationTotals = HOURS.map((hour) => {
      const hourCells = rows.map((r) => r.hours.find((h) => h.hour === hour)!);
      return {
        hour,
        totalUnits: hourCells.reduce((s, c) => s + c.totalUnits, 0),
        totalRevenue: hourCells.reduce((s, c) => s + c.totalRevenue, 0),
        quotaTarget: hourCells.reduce((s, c) => s + c.quotaTarget, 0),
        fulfillmentPct:
          hourCells.reduce((s, c) => s + c.quotaTarget, 0) > 0
            ? Math.round(
                (hourCells.reduce((s, c) => s + c.totalRevenue, 0) /
                  hourCells.reduce((s, c) => s + c.quotaTarget, 0)) *
                  10000
              ) / 100
            : 0,
      };
    });

    return jsonResponse({
      data: {
        stationId,
        date: dateStr,
        employees: rows,
        stationTotals,
      },
    });
  } catch (error) {
    console.error("GET /api/hr/dashboard/hourly-tracking error:", error);
    return errorResponse("Error al obtener seguimiento por hora", 500);
  }
}
