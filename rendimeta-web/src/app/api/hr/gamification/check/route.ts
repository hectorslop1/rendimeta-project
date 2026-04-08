import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function POST() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    return jsonResponse({
      checked: true,
      message: "Verificación de logros pendiente",
    });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
