import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const dateStr = url.searchParams.get("date");

    if (!employeeId || !dateStr) {
      return errorResponse("employeeId y date son requeridos", 400);
    }

    const date = new Date(dateStr);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);

    // Get employee with shift info
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { shift: true, station: { select: { id: true, name: true } } },
    });

    if (!employee) {
      return errorResponse("Empleado no encontrado", 404);
    }

    // Get quota assignments for this month
    const quotas = await prisma.quotaAssignment.findMany({
      where: { employeeId, month: monthStart },
    });

    const totalDailyTarget = quotas.reduce((sum, q) => sum + q.dailyTarget, 0);
    const totalMonthlyTarget = quotas.reduce((sum, q) => sum + q.monthlyTarget, 0);

    // Get hourly summaries for this date
    const hourlySummaries = await prisma.hourlySalesSummary.findMany({
      where: { employeeId, date },
      orderBy: { hour: "asc" },
    });

    // Build shift hours
    const shiftStart = employee.shift.startHour;
    const shiftEnd = employee.shift.endHour;
    const shiftHours: number[] = [];
    if (shiftEnd > shiftStart) {
      for (let h = shiftStart; h < shiftEnd; h++) shiftHours.push(h);
    } else {
      // Overnight shift
      for (let h = shiftStart; h < 24; h++) shiftHours.push(h);
      for (let h = 0; h < shiftEnd; h++) shiftHours.push(h);
    }

    const hoursInShift = shiftHours.length || 1;
    const hourlyTarget = totalDailyTarget / hoursInShift;

    // Index summaries by hour
    const summaryMap = new Map(hourlySummaries.map((s) => [s.hour, s]));

    let cumulativeTarget = 0;
    let cumulativeActual = 0;

    const hourlyPlan = shiftHours.map((hour) => {
      const summary = summaryMap.get(hour);
      const targetUnits = hourlyTarget;
      const targetRevenue = hourlyTarget; // revenue-based target if applicable
      const actualUnits = summary?.totalUnits ?? 0;
      const actualRevenue = summary?.totalRevenue ?? 0;

      cumulativeTarget += targetUnits;
      cumulativeActual += actualRevenue;

      const fulfillmentPct =
        targetRevenue > 0
          ? Math.round((actualRevenue / targetRevenue) * 10000) / 100
          : 0;

      return {
        hour,
        targetUnits: Math.round(targetUnits * 100) / 100,
        targetRevenue: Math.round(targetRevenue * 100) / 100,
        actualUnits,
        actualRevenue,
        fulfillmentPct,
        cumulativeTarget: Math.round(cumulativeTarget * 100) / 100,
        cumulativeActual: Math.round(cumulativeActual * 100) / 100,
        cumulativeFulfillmentPct:
          cumulativeTarget > 0
            ? Math.round((cumulativeActual / cumulativeTarget) * 10000) / 100
            : 0,
      };
    });

    return jsonResponse({
      data: {
        employee: {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          shift: employee.shift.name,
          station: employee.station.name,
        },
        date: dateStr,
        quotas: quotas.map((q) => ({
          categoryName: q.categoryName,
          dailyTarget: q.dailyTarget,
          monthlyTarget: q.monthlyTarget,
        })),
        totalDailyTarget,
        totalMonthlyTarget,
        hourlyPlan,
      },
    });
  } catch (error) {
    console.error("GET /api/hr/dashboard/daily-planner error:", error);
    return errorResponse("Error al obtener planificador diario", 500);
  }
}
