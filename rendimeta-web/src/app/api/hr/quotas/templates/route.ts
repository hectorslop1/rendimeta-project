import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const templates = await prisma.quotaTemplate.findMany({
      include: { category: true, station: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(templates);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 4) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const { name, categoryId, monthlyTarget } = body;

    if (!name || !categoryId || monthlyTarget === undefined) {
      return errorResponse("Nombre, categoría y meta mensual son requeridos", 400);
    }

    const template = await prisma.quotaTemplate.create({
      data: {
        name,
        categoryId,
        stationId: body.stationId || null,
        roleId: body.roleId || null,
        monthlyTarget,
        isRevenue: body.isRevenue ?? false,
      },
      include: { category: true, station: true },
    });

    return jsonResponse(template, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
