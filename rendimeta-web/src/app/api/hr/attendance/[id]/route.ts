import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const { id } = await params;
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { employee: true, station: true, shift: true },
    });
    if (!attendance) return errorResponse("Asistencia no encontrada", 404);

    return jsonResponse(attendance);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 1) return errorResponse("Sin permisos", 403);

    const { id } = await params;
    const body = await request.json();

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...(body.stationId && { stationId: body.stationId }),
        ...(body.shiftId && { shiftId: body.shiftId }),
        ...(body.clockIn !== undefined && { clockIn: body.clockIn ? new Date(body.clockIn) : null }),
        ...(body.clockOut !== undefined && { clockOut: body.clockOut ? new Date(body.clockOut) : null }),
        ...(body.hoursWorked !== undefined && { hoursWorked: body.hoursWorked }),
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: { employee: true, station: true, shift: true },
    });

    return jsonResponse(attendance);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
