import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || undefined;
    const stationId = url.searchParams.get("stationId") || undefined;
    const months = parseInt(url.searchParams.get("months") || "6", 10);

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      evaluationMonth: { gte: startDate },
    };

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (stationId) {
      where.employee = { stationId };
    }

    const evaluations = await prisma.performanceEvaluation.findMany({
      where,
      orderBy: { evaluationMonth: "asc" },
    });

    // Group by month
    const monthMap = new Map<
      string,
      {
        total: number;
        count: number;
        premium: number;
        productive: number;
        transition: number;
        nonProductive: number;
      }
    >();

    for (const ev of evaluations) {
      const monthKey = ev.evaluationMonth.toISOString().slice(0, 7); // YYYY-MM
      const group = monthMap.get(monthKey) || {
        total: 0,
        count: 0,
        premium: 0,
        productive: 0,
        transition: 0,
        nonProductive: 0,
      };

      group.total += ev.overallFulfillmentPct;
      group.count++;
      if (ev.classification === "PREMIUM") group.premium++;
      else if (ev.classification === "PRODUCTIVE") group.productive++;
      else if (ev.classification === "TRANSITION") group.transition++;
      else if (ev.classification === "NON_PRODUCTIVE") group.nonProductive++;

      monthMap.set(monthKey, group);
    }

    const trend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, g]) => ({
        month,
        avgFulfillmentPct:
          g.count > 0 ? Math.round((g.total / g.count) * 100) / 100 : 0,
        premiumCount: g.premium,
        productiveCount: g.productive,
        transitionCount: g.transition,
        nonProductiveCount: g.nonProductive,
      }));

    return jsonResponse({ data: trend });
  } catch (error) {
    console.error("GET /api/hr/dashboard/performance-trend error:", error);
    return errorResponse("Error al obtener tendencia de desempeño", 500);
  }
}
