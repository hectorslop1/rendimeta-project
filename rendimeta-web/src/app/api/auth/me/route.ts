import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) {
      return errorResponse("No autenticado", 401);
    }
    return jsonResponse({ user });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
