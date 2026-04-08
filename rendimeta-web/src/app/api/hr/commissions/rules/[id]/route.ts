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
    const rule = await prisma.commissionRule.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!rule) return errorResponse("Regla no encontrada", 404);

    return jsonResponse(rule);
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

    const rule = await prisma.commissionRule.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.tierMinPct !== undefined && { tierMinPct: body.tierMinPct }),
        ...(body.tierMaxPct !== undefined && { tierMaxPct: body.tierMaxPct }),
        ...(body.commissionPct !== undefined && { commissionPct: body.commissionPct }),
        ...(body.commissionFixed !== undefined && { commissionFixed: body.commissionFixed }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: { category: true },
    });

    return jsonResponse(rule);
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
    await prisma.commissionRule.update({ where: { id }, data: { isActive: false } });

    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
