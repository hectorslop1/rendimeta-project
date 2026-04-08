import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const config = await prisma.systemConfig.findFirst();
    return jsonResponse(config);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 5) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const existing = await prisma.systemConfig.findFirst();

    if (!existing) {
      const config = await prisma.systemConfig.create({ data: body });
      return jsonResponse(config);
    }

    const config = await prisma.systemConfig.update({
      where: { id: existing.id },
      data: body,
    });

    return jsonResponse(config);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
