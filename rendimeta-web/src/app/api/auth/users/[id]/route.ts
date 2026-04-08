import { prisma } from "@/lib/prisma";
import { validateSession, invalidateAllUserSessions } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";
import type { UpdateUserRequest } from "@/types/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await validateSession();
    if (!currentUser) return errorResponse("No autenticado", 401);

    const { id } = await params;

    if (currentUser.role.level < 5 && currentUser.id !== id) {
      return errorResponse("Sin permisos", 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
      },
    });

    if (!user) return errorResponse("Usuario no encontrado", 404);

    return jsonResponse({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        level: user.role.level,
        isActive: user.role.isActive,
      },
      employeeId: user.employeeId,
      employee: user.employee,
      stationIds: user.stationIds as string[] | null,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await validateSession();
    if (!currentUser) return errorResponse("No autenticado", 401);
    if (currentUser.role.level < 5) return errorResponse("Sin permisos", 403);

    const { id } = await params;
    const body = (await request.json()) as UpdateUserRequest;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return errorResponse("Usuario no encontrado", 404);

    if (body.email) {
      const dup = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      });
      if (dup && dup.id !== id) {
        return errorResponse("Ya existe un usuario con ese email", 400);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.email && { email: body.email.toLowerCase() }),
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.roleId && { roleId: body.roleId }),
        ...(body.employeeId !== undefined && { employeeId: body.employeeId || null }),
        ...(body.stationIds !== undefined && { stationIds: body.stationIds }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: { role: true },
    });

    if (body.isActive === false) {
      await invalidateAllUserSessions(id);
    }

    return jsonResponse({
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: {
        id: updated.role.id,
        name: updated.role.name,
        description: updated.role.description,
        level: updated.role.level,
        isActive: updated.role.isActive,
      },
      employeeId: updated.employeeId,
      stationIds: updated.stationIds as string[] | null,
      isActive: updated.isActive,
      lastLoginAt: updated.lastLoginAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await validateSession();
    if (!currentUser) return errorResponse("No autenticado", 401);
    if (currentUser.role.level < 5) return errorResponse("Sin permisos", 403);

    const { id } = await params;

    if (currentUser.id === id) {
      return errorResponse("No puedes desactivar tu propia cuenta", 400);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await invalidateAllUserSessions(id);

    return jsonResponse({ success: true, message: "Usuario desactivado" });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
