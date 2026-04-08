import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const month = url.searchParams.get("month") || undefined;
    const employeeId = url.searchParams.get("employeeId") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (month) where.month = new Date(month);
    if (employeeId) where.employeeId = employeeId;

    const scores = await prisma.gamificationScore.findMany({
      where,
      include: { employee: true },
      orderBy: { totalPoints: "desc" },
    });

    return jsonResponse(scores);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
