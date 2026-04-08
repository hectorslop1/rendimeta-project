import { prisma } from "@/lib/prisma";
import {
  validateSession,
  hashPassword,
  generateTemporaryPassword,
  invalidateAllUserSessions,
} from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await validateSession();
    if (!currentUser) return errorResponse("No autenticado", 401);
    if (currentUser.role.level < 5) return errorResponse("Sin permisos", 403);

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return errorResponse("Usuario no encontrado", 404);

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await invalidateAllUserSessions(id);

    return jsonResponse({
      success: true,
      temporaryPassword: tempPassword,
      message: "Contraseña restablecida",
    });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
