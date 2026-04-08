import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const roles = await prisma.role.findMany({
      orderBy: { level: "desc" },
    });

    return jsonResponse(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        level: r.level,
        isActive: r.isActive,
      }))
    );
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
    const { name, description, level } = body;

    if (!name || level === undefined) {
      return errorResponse("Nombre y nivel son requeridos", 400);
    }

    const role = await prisma.role.create({
      data: { name, description: description || null, level },
    });

    return jsonResponse(role, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
