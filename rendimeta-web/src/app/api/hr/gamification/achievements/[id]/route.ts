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
    const achievement = await prisma.achievementDefinition.findUnique({ where: { id } });
    if (!achievement) return errorResponse("Logro no encontrado", 404);

    return jsonResponse(achievement);
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

    const achievement = await prisma.achievementDefinition.update({
      where: { id },
      data: {
        ...(body.code && { code: body.code }),
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.iconEmoji && { iconEmoji: body.iconEmoji }),
        ...(body.category && { category: body.category }),
        ...(body.pointValue !== undefined && { pointValue: body.pointValue }),
        ...(body.condition !== undefined && { condition: body.condition }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return jsonResponse(achievement);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
