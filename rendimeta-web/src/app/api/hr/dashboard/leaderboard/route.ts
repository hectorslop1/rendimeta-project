import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") || "global";
    const stationId = url.searchParams.get("stationId") || undefined;
    const stateId = url.searchParams.get("stateId") || undefined;
    const cityId = url.searchParams.get("cityId") || undefined;
    const monthStr = url.searchParams.get("month") || undefined;

    // Build employee filter based on scope
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeWhere: Record<string, any> = { status: "ACTIVE" };

    if (scope === "station" && stationId) {
      employeeWhere.stationId = stationId;
    } else if (scope === "city" && cityId) {
      employeeWhere.station = { cityId };
    } else if (scope === "state" && stateId) {
      employeeWhere.station = { city: { stateId } };
    }

    // Get latest evaluation per employee (or for a specific month)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evalWhere: Record<string, any> = {
      employee: employeeWhere,
    };
    if (monthStr) {
      evalWhere.evaluationMonth = new Date(monthStr);
    }

    const evaluations = await prisma.performanceEvaluation.findMany({
      where: evalWhere,
      orderBy: { evaluationMonth: "desc" },
      distinct: ["employeeId"],
      include: {
        employee: {
          include: {
            station: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Get previous month evaluations for trend calculation
    const employeeIds = evaluations.map((e) => e.employeeId);

    // Calculate what "previous month" means
    const refDate = monthStr ? new Date(monthStr) : new Date();
    const prevMonthDate = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);

    const prevEvals = await prisma.performanceEvaluation.findMany({
      where: {
        employeeId: { in: employeeIds },
        evaluationMonth: prevMonthDate,
      },
    });
    const prevMap = new Map(prevEvals.map((e) => [e.employeeId, e.overallFulfillmentPct]));

    // Get gamification scores for the current month
    const currentMonth = monthStr ? new Date(monthStr) : new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    const gamScores = await prisma.gamificationScore.findMany({
      where: {
        employeeId: { in: employeeIds },
        month: currentMonth,
      },
    });
    const gamMap = new Map(gamScores.map((g) => [g.employeeId, g.totalPoints]));

    // Sort by fulfillment descending
    const sorted = evaluations.sort(
      (a, b) => b.overallFulfillmentPct - a.overallFulfillmentPct
    );

    const leaderboard = sorted.map((ev, index) => {
      const prevPct = prevMap.get(ev.employeeId);
      const trendPct =
        prevPct != null && prevPct !== 0
          ? Math.round(((ev.overallFulfillmentPct - prevPct) / prevPct) * 10000) / 100
          : null;

      return {
        rank: index + 1,
        employeeId: ev.employeeId,
        employeeName: `${ev.employee.firstName} ${ev.employee.lastName}`,
        stationId: ev.employee.station.id,
        stationName: ev.employee.station.name,
        classification: ev.classification,
        fulfillmentPct: ev.overallFulfillmentPct,
        fuelSalesAmount: ev.fuelSalesAmount,
        peripheralSalesAmount: ev.peripheralSalesAmount,
        totalSales: ev.fuelSalesAmount + ev.peripheralSalesAmount,
        gamificationPoints: gamMap.get(ev.employeeId) ?? 0,
        trendPct,
      };
    });

    return jsonResponse({ data: leaderboard });
  } catch (error) {
    console.error("GET /api/hr/dashboard/leaderboard error:", error);
    return errorResponse("Error al obtener ranking", 500);
  }
}
