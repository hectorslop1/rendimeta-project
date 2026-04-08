import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);

    const url = new URL(request.url);
    const stationId = url.searchParams.get("stationId") || undefined;
    const employeeId = url.searchParams.get("employeeId") || undefined;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (stationId) where.stationId = stationId;
    if (employeeId) where.employeeId = employeeId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    // Get sale records with product category info
    const sales = await prisma.saleRecord.findMany({
      where,
      include: {
        product: {
          include: { category: { select: { id: true, name: true, code: true } } },
        },
      },
    });

    // Count distinct employees for avg calculation
    const employeeSet = new Set<string>();
    const categoryMap = new Map<
      string,
      { categoryId: string; category: string; code: string; totalUnits: number; totalRevenue: number }
    >();

    for (const sale of sales) {
      employeeSet.add(sale.employeeId);
      const catName = sale.product.category.name;
      const existing = categoryMap.get(catName) || {
        categoryId: sale.product.category.id,
        category: catName,
        code: sale.product.category.code,
        totalUnits: 0,
        totalRevenue: 0,
      };
      existing.totalUnits += sale.quantity;
      existing.totalRevenue += sale.totalAmount;
      categoryMap.set(catName, existing);
    }

    const employeeCount = employeeSet.size || 1;

    const categories = Array.from(categoryMap.values())
      .map((c) => ({
        categoryId: c.categoryId,
        category: c.category,
        code: c.code,
        totalUnits: Math.round(c.totalUnits * 100) / 100,
        totalRevenue: Math.round(c.totalRevenue * 100) / 100,
        avgPerEmployee: Math.round((c.totalRevenue / employeeCount) * 100) / 100,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return jsonResponse({ data: categories });
  } catch (error) {
    console.error("GET /api/hr/dashboard/category-analysis error:", error);
    return errorResponse("Error al obtener análisis por categoría", 500);
  }
}
