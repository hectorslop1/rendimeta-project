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
    const evaluation = await prisma.performanceEvaluation.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!evaluation) return errorResponse("Evaluación no encontrada", 404);

    return jsonResponse(evaluation);
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

    const evaluation = await prisma.performanceEvaluation.update({
      where: { id },
      data: {
        ...(body.overallFulfillmentPct !== undefined && { overallFulfillmentPct: body.overallFulfillmentPct }),
        ...(body.classification && { classification: body.classification }),
        ...(body.fuelSalesAmount !== undefined && { fuelSalesAmount: body.fuelSalesAmount }),
        ...(body.peripheralSalesAmount !== undefined && { peripheralSalesAmount: body.peripheralSalesAmount }),
        ...(body.attendanceScore !== undefined && { attendanceScore: body.attendanceScore }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.evaluatedBy !== undefined && { evaluatedBy: body.evaluatedBy }),
      },
      include: { employee: true },
    });

    return jsonResponse(evaluation);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
