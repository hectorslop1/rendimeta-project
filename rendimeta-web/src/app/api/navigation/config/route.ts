import { validateSession } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api-helpers";
import {
  activateNavigationTemplate,
  getNavigationConfig,
  saveNavigationConfig,
} from "@/lib/navigation-store";
import {
  sanitizeNavigationConfig,
  type NavigationConfig,
  type SaveNavigationConfigOptions,
} from "@/lib/navigation";

export async function GET() {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const state = await getNavigationConfig();
    return jsonResponse(state);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 5) return errorResponse("Sin permisos", 403);

    const body = (await request.json()) as
      | NavigationConfig
      | { config?: NavigationConfig; options?: SaveNavigationConfigOptions };
    const wrappedBody = body as { config?: NavigationConfig; options?: SaveNavigationConfigOptions };
    const nextConfig = wrappedBody.config ?? (body as NavigationConfig);
    const options = wrappedBody.options;
    const state = await saveNavigationConfig(sanitizeNavigationConfig(nextConfig), options);
    return jsonResponse(state);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Error interno del servidor",
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 5) return errorResponse("Sin permisos", 403);

    const body = (await request.json()) as { templateId?: string };
    if (!body.templateId) return errorResponse("Template requerido", 400);

    const state = await activateNavigationTemplate(body.templateId);
    return jsonResponse(state);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
