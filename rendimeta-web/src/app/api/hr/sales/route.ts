import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const date = url.searchParams.get("date") || undefined;
    const employeeId = url.searchParams.get("employeeId") || undefined;
    const stationId = url.searchParams.get("stationId") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (date) where.date = new Date(date);
    if (employeeId) where.employeeId = employeeId;
    if (stationId) where.stationId = stationId;

    const records = await prisma.saleRecord.findMany({
      where,
      include: { employee: true, product: true, station: true },
      orderBy: { date: "desc" },
    });

    return jsonResponse(records);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 1) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const { employeeId, productId, stationId, date, hour, quantity, unitPrice, totalAmount } = body;

    if (!employeeId || !productId || !stationId || !date || hour === undefined || quantity === undefined || unitPrice === undefined || totalAmount === undefined) {
      return errorResponse("Faltan campos requeridos", 400);
    }

    const record = await prisma.saleRecord.create({
      data: {
        employeeId,
        productId,
        stationId,
        date: new Date(date),
        hour,
        quantity,
        unitPrice,
        totalAmount,
      },
    });

    return jsonResponse(record, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
