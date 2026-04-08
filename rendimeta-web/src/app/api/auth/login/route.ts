import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
} from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";
import type { LoginRequest } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest;
    const { email, password, remember } = body;

    if (!email || !password) {
      return errorResponse("Email y contraseña son requeridos", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      return errorResponse("Credenciales inválidas", 401);
    }

    if (!user.isActive) {
      return errorResponse("Usuario desactivado. Contacte al administrador.", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return errorResponse("Credenciales inválidas", 401);
    }

    const ip = request.headers.get("x-forwarded-for") ?? undefined;
    const ua = request.headers.get("user-agent") ?? undefined;
    const session = await createSession(user.id, !!remember, ip, ua);

    await setSessionCookie(session.token, session.expiresAt, !!remember);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          level: user.role.level,
          isActive: user.role.isActive,
        },
        employeeId: user.employeeId,
        stationIds: user.stationIds as string[] | null,
        isActive: user.isActive,
        lastLoginAt: new Date().toISOString(),
        createdAt: user.createdAt.toISOString(),
      },
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (e) {
    console.error("[LOGIN ERROR]", e);
    return errorResponse("Error interno del servidor", 500);
  }
}
