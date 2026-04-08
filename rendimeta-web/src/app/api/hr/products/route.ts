import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const categoryId = url.searchParams.get("categoryId") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
    });

    return jsonResponse(products);
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
    const { sku, name, categoryId, unitPrice } = body;

    if (!sku || !name || !categoryId || unitPrice === undefined) {
      return errorResponse("SKU, nombre, categoría y precio son requeridos", 400);
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        categoryId,
        unitPrice,
        costPrice: body.costPrice ?? 0,
        unit: body.unit ?? "pieza",
      },
      include: { category: true },
    });

    return jsonResponse(product, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
