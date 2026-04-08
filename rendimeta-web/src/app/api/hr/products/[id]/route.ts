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
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) return errorResponse("Producto no encontrado", 404);

    return jsonResponse(product);
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(body.sku && { sku: body.sku }),
        ...(body.name && { name: body.name }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.unitPrice !== undefined && { unitPrice: body.unitPrice }),
        ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
        ...(body.unit && { unit: body.unit }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: { category: true },
    });

    return jsonResponse(product);
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
    await prisma.product.update({ where: { id }, data: { isActive: false } });

    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
