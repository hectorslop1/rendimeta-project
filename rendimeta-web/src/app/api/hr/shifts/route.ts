import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const shifts = await prisma.shift.findMany({
      orderBy: { startHour: "asc" },
    });

    return jsonResponse(shifts);
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
    const { name, startHour, endHour } = body;

    if (!name || startHour === undefined || endHour === undefined) {
      return errorResponse("Nombre, hora inicio y hora fin son requeridos", 400);
    }

    const shift = await prisma.shift.create({
      data: { name, startHour, endHour },
    });

    return jsonResponse(shift, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
