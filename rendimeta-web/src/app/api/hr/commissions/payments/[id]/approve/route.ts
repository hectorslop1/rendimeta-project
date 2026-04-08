import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 3) return errorResponse("Sin permisos", 403);

    const { id } = await params;

    const payment = await prisma.commissionPayment.findUnique({ where: { id } });
    if (!payment) return errorResponse("Pago no encontrado", 404);

    const updated = await prisma.commissionPayment.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { employee: true },
    });

    return jsonResponse(updated);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
