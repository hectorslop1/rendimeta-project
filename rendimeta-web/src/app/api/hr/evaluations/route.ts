import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const month = url.searchParams.get("month") || undefined;
    const classification = url.searchParams.get("classification") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (month) where.evaluationMonth = new Date(month);
    if (classification) where.classification = classification;

    const evaluations = await prisma.performanceEvaluation.findMany({
      where,
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });

    return jsonResponse(evaluations);
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
    const { employeeId, evaluationMonth, overallFulfillmentPct, classification } = body;

    if (!employeeId || !evaluationMonth || overallFulfillmentPct === undefined || !classification) {
      return errorResponse("Faltan campos requeridos", 400);
    }

    const evaluation = await prisma.performanceEvaluation.create({
      data: {
        employeeId,
        evaluationMonth: new Date(evaluationMonth),
        overallFulfillmentPct,
        classification,
        fuelSalesAmount: body.fuelSalesAmount ?? 0,
        peripheralSalesAmount: body.peripheralSalesAmount ?? 0,
        attendanceScore: body.attendanceScore ?? 100,
        notes: body.notes ?? null,
        evaluatedBy: body.evaluatedBy ?? null,
      },
      include: { employee: true },
    });

    return jsonResponse(evaluation, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
