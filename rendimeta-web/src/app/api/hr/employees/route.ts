import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const stationId = url.searchParams.get("stationId") || undefined;
    const roleId = url.searchParams.get("roleId") || undefined;
    const status = url.searchParams.get("status") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    if (stationId) where.stationId = stationId;
    if (roleId) where.roleId = roleId;
    if (status) where.status = status;

    const employees = await prisma.employee.findMany({
      where,
      include: { role: true, shift: true, station: true },
      orderBy: { lastName: "asc" },
    });

    return jsonResponse(employees);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 2) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const { employeeNumber, firstName, lastName, roleId, shiftId, stationId, hireDate } = body;

    if (!employeeNumber || !firstName || !lastName || !roleId || !shiftId || !stationId || !hireDate) {
      return errorResponse("Faltan campos requeridos", 400);
    }

    const employee = await prisma.employee.create({
      data: {
        employeeNumber,
        firstName,
        lastName,
        email: body.email || null,
        phone: body.phone || null,
        roleId,
        shiftId,
        stationId,
        hireDate: new Date(hireDate),
        avatarUrl: body.avatarUrl || null,
      },
      include: { role: true, shift: true, station: true },
    });

    return jsonResponse(employee, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
