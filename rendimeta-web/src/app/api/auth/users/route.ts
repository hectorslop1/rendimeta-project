import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { validateSession, hashPassword, generateTemporaryPassword } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";
import type { CreateUserRequest } from "@/types/auth";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 5) return errorResponse("Sin permisos", 403);

    const users = await prisma.user.findMany({
      include: {
        role: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: {
          id: u.role.id,
          name: u.role.name,
          description: u.role.description,
          level: u.role.level,
          isActive: u.role.isActive,
        },
        employeeId: u.employeeId,
        employee: u.employee,
        stationIds: u.stationIds as string[] | null,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))
    );
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await validateSession();
    if (!currentUser) return errorResponse("No autenticado", 401);
    if (currentUser.role.level < 5) return errorResponse("Sin permisos", 403);

    const body = (await request.json()) as CreateUserRequest;
    const { email, firstName, lastName, roleId, employeeId, stationIds } = body;

    if (!email || !firstName || !lastName || !roleId) {
      return errorResponse("Email, nombre, apellido y rol son requeridos", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) return errorResponse("Ya existe un usuario con ese email", 400);

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return errorResponse("Rol no encontrado", 404);

    const tempPassword = body.password || generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        roleId,
        employeeId: employeeId || null,
        stationIds: stationIds ?? Prisma.JsonNull,
      },
      include: { role: true },
    });

    return jsonResponse(
      {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: {
          id: newUser.role.id,
          name: newUser.role.name,
          description: newUser.role.description,
          level: newUser.role.level,
          isActive: newUser.role.isActive,
        },
        employeeId: newUser.employeeId,
        stationIds: newUser.stationIds as string[] | null,
        isActive: newUser.isActive,
        temporaryPassword: tempPassword,
        createdAt: newUser.createdAt.toISOString(),
      },
      201
    );
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
