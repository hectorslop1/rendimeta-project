import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const achievements = await prisma.achievementDefinition.findMany({
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(achievements);
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
    const { code, name, description } = body;

    if (!code || !name || !description) {
      return errorResponse("Código, nombre y descripción son requeridos", 400);
    }

    const achievement = await prisma.achievementDefinition.create({
      data: {
        code,
        name,
        description,
        iconEmoji: body.iconEmoji ?? "🏆",
        category: body.category ?? "sales",
        pointValue: body.pointValue ?? 10,
        condition: body.condition ?? {},
      },
    });

    return jsonResponse(achievement, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
