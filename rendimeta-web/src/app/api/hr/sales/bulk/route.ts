import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 1) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return errorResponse("Se requiere un arreglo de registros de venta", 400);
    }

    const data = records.map((r: {
      employeeId: string;
      productId: string;
      stationId: string;
      date: string;
      hour: number;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }) => ({
      employeeId: r.employeeId,
      productId: r.productId,
      stationId: r.stationId,
      date: new Date(r.date),
      hour: r.hour,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      totalAmount: r.totalAmount,
    }));

    const result = await prisma.saleRecord.createMany({ data });

    return jsonResponse({ created: result.count }, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
