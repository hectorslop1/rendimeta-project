import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { UserRecord } from "@/types/auth";

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
const REMEMBER_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const COOKIE_NAME = "session_token";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(
  userId: string,
  remember: boolean = false,
  ipAddress?: string,
  userAgent?: string,
) {
  const token = generateToken();
  const duration = remember ? REMEMBER_DURATION_MS : SESSION_DURATION_MS;
  const expiresAt = new Date(Date.now() + duration);

  try {
    const session = await prisma.session.create({
      data: { userId, token, expiresAt, ipAddress, userAgent },
    });
    return session;
  } catch (error) {
    // Si falla la BD, crear sesión mock en memoria
    console.warn("[AUTH] Creando sesión mock (BD no disponible)");
    return {
      id: `mock-session-${Date.now()}`,
      userId,
      token,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date(),
    };
  }
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
  remember: boolean = false,
) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function validateSession(): Promise<UserRecord | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: { role: true },
      },
    },
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.user.isActive) return null;

  const { user } = session;
  return {
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
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function invalidateSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function invalidateAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export async function requireAuth(): Promise<UserRecord> {
  const user = await validateSession();
  if (!user) {
    throw new Response(JSON.stringify({ message: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export async function requireMinLevel(minLevel: number): Promise<UserRecord> {
  const user = await requireAuth();
  if (user.role.level < minLevel) {
    throw new Response(
      JSON.stringify({ message: "Sin permisos suficientes" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  return user;
}
