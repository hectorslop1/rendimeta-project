import { prisma } from "@/lib/prisma";
import { validateSession, verifyPassword, hashPassword } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";
import type { ChangePasswordRequest } from "@/types/auth";

export async function PUT(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const body = (await request.json()) as ChangePasswordRequest;
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse("Contraseña actual y nueva son requeridas", 400);
    }

    if (newPassword.length < 6) {
      return errorResponse("La nueva contraseña debe tener al menos 6 caracteres", 400);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return errorResponse("Usuario no encontrado", 404);

    const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!valid) return errorResponse("Contraseña actual incorrecta", 400);

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return jsonResponse({ success: true, message: "Contraseña actualizada" });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
