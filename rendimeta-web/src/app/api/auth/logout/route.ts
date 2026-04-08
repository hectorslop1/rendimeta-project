import { getSessionToken, invalidateSession, clearSessionCookie } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function POST() {
  try {
    const token = await getSessionToken();
    if (token) {
      await invalidateSession(token);
    }
    await clearSessionCookie();
    return jsonResponse({ success: true });
  } catch {
    return errorResponse("Error al cerrar sesión", 500);
  }
}
