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
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { role: true, shift: true, station: true },
    });
    if (!employee) return errorResponse("Empleado no encontrado", 404);

    return jsonResponse(employee);
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
          terminationDate: body.terminationDate ? new Date(body.terminationDate) : null,
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
  { params }: { params: Promise<{ id: string }> }
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
