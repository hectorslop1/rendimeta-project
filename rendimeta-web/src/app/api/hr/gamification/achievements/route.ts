import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId") || undefined;

    const achievements = await prisma.achievementDefinition.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (!employeeId) {
      return jsonResponse(achievements);
    }

    const employeeAchievements = await prisma.employeeAchievement.findMany({
      where: { employeeId },
      select: { achievementId: true, earnedAt: true },
    });

    const earnedByAchievementId = new Map(
      employeeAchievements.map((ea) => [ea.achievementId, ea.earnedAt] as const)
    );

    const achievementsWithStatus = achievements.map((ach) => {
      const earnedAt = earnedByAchievementId.get(ach.id);
      return {
        id: ach.id,
        code: ach.code,
        name: ach.name,
        description: ach.description,
        iconEmoji: ach.iconEmoji,
        pointValue: ach.pointValue,
        earned: !!earnedAt,
        earnedAt: earnedAt?.toISOString(),
      };
    });

    return jsonResponse(achievementsWithStatus);
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
