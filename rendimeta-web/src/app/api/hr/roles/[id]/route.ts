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
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return errorResponse("Rol no encontrado", 404);

    return jsonResponse(role);
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
    if (user.role.level < 4) return errorResponse("Sin permisos", 403);

    const { id } = await params;
    const body = await request.json();

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return jsonResponse(role);
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
    await prisma.role.update({ where: { id }, data: { isActive: false } });

    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
