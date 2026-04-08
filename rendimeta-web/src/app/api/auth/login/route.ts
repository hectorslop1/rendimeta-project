import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";
import type { LoginRequest } from "@/types/auth";

// Usuarios mock para desarrollo (cuando no hay BD disponible)
const MOCK_USERS = [
  {
    id: "mock-1",
    email: "admin@sistema.com",
    password: "admin123",
    firstName: "Super",
    lastName: "Admin",
    role: {
      id: "role-5",
      name: "Super Admin",
      description: "Acceso total",
      level: 5,
      isActive: true,
    },
    employeeId: "EMP-001",
    stationIds: null,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: null,
  },
  {
    id: "mock-2",
    email: "administrador@sistema.com",
    password: "admin123",
    firstName: "Admin",
    lastName: "General",
    role: {
      id: "role-4",
      name: "Administrador",
      description: "Administrador",
      level: 4,
      isActive: true,
    },
    employeeId: "EMP-002",
    stationIds: null,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: null,
  },
  {
    id: "mock-3",
    email: "gerente.regional@sistema.com",
    password: "admin123",
    firstName: "Gerente",
    lastName: "Regional",
    role: {
      id: "role-3",
      name: "Gerente Regional",
      description: "Gerente Regional",
      level: 3,
      isActive: true,
    },
    employeeId: "EMP-003",
    stationIds: ["station-1", "station-2"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: null,
  },
  {
    id: "mock-4",
    email: "gerente.estacion@sistema.com",
    password: "admin123",
    firstName: "Gerente",
    lastName: "Estación",
    role: {
      id: "role-2",
      name: "Gerente Estación",
      description: "Gerente de Estación",
      level: 2,
      isActive: true,
    },
    employeeId: "EMP-004",
    stationIds: ["station-1"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: null,
  },
  {
    id: "mock-5",
    email: "supervisor@sistema.com",
    password: "admin123",
    firstName: "Encargado",
    lastName: "Turno",
    role: {
      id: "role-1",
      name: "Encargado Turno",
      description: "Supervisor de turno",
      level: 1,
      isActive: true,
    },
    employeeId: "EMP-005",
    stationIds: ["station-1"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: null,
  },
  {
    id: "mock-6",
    email: "empleado@sistema.com",
    password: "admin123",
    firstName: "Empleado",
    lastName: "Despachador",
    role: {
      id: "role-0",
      name: "Despachador",
      description: "Despachador",
      level: 0,
      isActive: true,
    },
    employeeId: "EMP-006",
    stationIds: ["station-1"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: null,
  },
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest;
    const { email, password, remember } = body;

    if (!email || !password) {
      return errorResponse("Email y contraseña son requeridos", 400);
    }

    let user;
    let useMockAuth = false;

    // Intentar autenticación con base de datos
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { role: true },
      });
    } catch (dbError) {
      // Si falla la conexión a BD, usar autenticación mock
      console.warn(
        "[AUTH] Base de datos no disponible, usando autenticación mock",
      );
      useMockAuth = true;

      const mockUser = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (mockUser && mockUser.password === password) {
        user = mockUser as any;
      }
    }

    if (!user) {
      return errorResponse("Credenciales inválidas", 401);
    }

    if (!user.isActive) {
      return errorResponse(
        "Usuario desactivado. Contacte al administrador.",
        401,
      );
    }

    // Validar contraseña según el modo
    if (!useMockAuth) {
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return errorResponse("Credenciales inválidas", 401);
      }
    }

    const ip = request.headers.get("x-forwarded-for") ?? undefined;
    const ua = request.headers.get("user-agent") ?? undefined;
    const session = await createSession(user.id, !!remember, ip, ua);

    await setSessionCookie(session.token, session.expiresAt, !!remember);

    // Solo actualizar BD si no estamos en modo mock
    if (!useMockAuth) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

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
