import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const rules = await prisma.commissionRule.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(rules);
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
    const { name, categoryId, tierMinPct, commissionPct } = body;

    if (!name || !categoryId || tierMinPct === undefined || commissionPct === undefined) {
      return errorResponse("Nombre, categoría, porcentaje mínimo y comisión son requeridos", 400);
    }

    const rule = await prisma.commissionRule.create({
      data: {
        name,
        categoryId,
        tierMinPct,
        tierMaxPct: body.tierMaxPct ?? null,
        commissionPct,
        commissionFixed: body.commissionFixed ?? null,
      },
      include: { category: true },
    });

    return jsonResponse(rule, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
