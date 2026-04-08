import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        role: true,
        shift: true,
        station: { include: { city: { include: { state: true } } } },
        achievements: {
          include: { achievement: true },
          orderBy: { earnedAt: "desc" },
          take: 10,
        },
      },
    });
    if (!employee) return errorResponse("Empleado no encontrado", 404);

    // Get latest evaluation
    const latestEvaluation = await prisma.performanceEvaluation.findFirst({
      where: { employeeId: id },
      orderBy: { evaluationMonth: "desc" },
    });

    // Get gamification scores (last 3 months)
    const gamificationScores = await prisma.gamificationScore.findMany({
      where: { employeeId: id },
      orderBy: { month: "desc" },
      take: 3,
    });

    // Get total sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = await prisma.saleRecord.aggregate({
      where: { employeeId: id, date: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true, quantity: true },
      _count: true,
    });

    // Get attendance stats (last 30 days)
    const attendanceStats = await prisma.attendance.groupBy({
      by: ["status"],
      where: { employeeId: id, date: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // Get latest commission payment
    const latestCommission = await prisma.commissionPayment.findFirst({
      where: { employeeId: id },
      orderBy: { month: "desc" },
    });

    // Current streak (consecutive present days)
    const recentAttendance = await prisma.attendance.findMany({
      where: { employeeId: id },
      orderBy: { date: "desc" },
      take: 60,
      select: { status: true, date: true },
    });
    let currentStreak = 0;
    for (const att of recentAttendance) {
      if (att.status === "PRESENT" || att.status === "LATE") {
        currentStreak++;
      } else if (att.status === "ABSENT") {
        break;
      }
    }

    const totalPoints = gamificationScores.reduce(
      (acc, g) => acc + (g.totalPoints ?? 0),
      0,
    );

    return jsonResponse({
      ...employee,
      latestEvaluation,
      gamificationScores,
      totalPoints,
      currentStreak,
      recentSales: {
        totalAmount: recentSales._sum.totalAmount ?? 0,
        totalQuantity: recentSales._sum.quantity ?? 0,
        transactionCount: recentSales._count,
      },
      attendanceStats: Object.fromEntries(
        attendanceStats.map((a) => [a.status, a._count]),
      ),
      latestCommission,
    });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 2) return errorResponse("Sin permisos", 403);

    const { id } = await params;
    const body = await request.json();

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.roleId && { roleId: body.roleId }),
        ...(body.shiftId && { shiftId: body.shiftId }),
        ...(body.stationId && { stationId: body.stationId }),
        ...(body.hireDate && { hireDate: new Date(body.hireDate) }),
        ...(body.terminationDate !== undefined && {
          terminationDate: body.terminationDate
            ? new Date(body.terminationDate)
            : null,
        }),
        ...(body.status && { status: body.status }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
      },
      include: { role: true, shift: true, station: true },
    });

    return jsonResponse(employee);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 4) return errorResponse("Sin permisos", 403);

    const { id } = await params;
    await prisma.employee.update({
      where: { id },
      data: { status: "TERMINATED", terminationDate: new Date() },
    });

    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
