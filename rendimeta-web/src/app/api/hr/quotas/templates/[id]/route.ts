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
    const template = await prisma.quotaTemplate.findUnique({
      where: { id },
      include: { category: true, station: true },
    });
    if (!template) return errorResponse("Plantilla no encontrada", 404);

    return jsonResponse(template);
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

    const template = await prisma.quotaTemplate.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.stationId !== undefined && { stationId: body.stationId || null }),
        ...(body.roleId !== undefined && { roleId: body.roleId || null }),
        ...(body.monthlyTarget !== undefined && { monthlyTarget: body.monthlyTarget }),
        ...(body.isRevenue !== undefined && { isRevenue: body.isRevenue }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: { category: true, station: true },
    });

    return jsonResponse(template);
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
    await prisma.quotaTemplate.update({ where: { id }, data: { isActive: false } });

    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
