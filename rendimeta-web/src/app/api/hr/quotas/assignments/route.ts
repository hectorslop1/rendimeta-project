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

    const assignments = await prisma.quotaAssignment.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(assignments);
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
    const { employeeId, month, dailyTarget, monthlyTarget, categoryName } = body;

    if (!employeeId || !month || dailyTarget === undefined || monthlyTarget === undefined || !categoryName) {
      return errorResponse("Faltan campos requeridos", 400);
    }

    const assignment = await prisma.quotaAssignment.create({
      data: {
        employeeId,
        templateId: body.templateId || null,
        month: new Date(month),
        dailyTarget,
        monthlyTarget,
        categoryName,
      },
      include: { employee: true },
    });

    return jsonResponse(assignment, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
