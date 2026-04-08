import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const date = url.searchParams.get("date") || undefined;
    const stationId = url.searchParams.get("stationId") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (date) where.date = new Date(date);
    if (stationId) where.stationId = stationId;

    const attendances = await prisma.attendance.findMany({
      where,
      include: { employee: true, station: true, shift: true },
      orderBy: { date: "desc" },
    });

    return jsonResponse(attendances);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 1) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const { employeeId, stationId, shiftId, date } = body;

    if (!employeeId || !stationId || !shiftId || !date) {
      return errorResponse("Empleado, estación, turno y fecha son requeridos", 400);
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: new Date(date),
        },
      },
      update: {
        stationId,
        shiftId,
        clockIn: body.clockIn ? new Date(body.clockIn) : undefined,
        clockOut: body.clockOut ? new Date(body.clockOut) : undefined,
        hoursWorked: body.hoursWorked ?? undefined,
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
      },
      create: {
        employeeId,
        stationId,
        shiftId,
        date: new Date(date),
        clockIn: body.clockIn ? new Date(body.clockIn) : null,
        clockOut: body.clockOut ? new Date(body.clockOut) : null,
        hoursWorked: body.hoursWorked ?? null,
        status: body.status ?? "PRESENT",
        notes: body.notes ?? null,
      },
      include: { employee: true, station: true, shift: true },
    });

    return jsonResponse(attendance, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
