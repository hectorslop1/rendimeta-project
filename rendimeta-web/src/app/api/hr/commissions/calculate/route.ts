import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 4) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const { month } = body;

    if (!month) {
      return errorResponse("Mes es requerido", 400);
    }

    const monthDate = new Date(month);
    const year = monthDate.getFullYear();
    const monthNum = monthDate.getMonth();
    const monthStart = new Date(year, monthNum, 1);
    const monthEnd = new Date(year, monthNum + 1, 0);

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
    });

    // Get all active commission rules
    const rules = await prisma.commissionRule.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { tierMinPct: "asc" },
    });

    // Group rules by category
    const rulesByCategory = new Map<string, typeof rules>();
    for (const rule of rules) {
      const key = rule.category.name;
      if (!rulesByCategory.has(key)) rulesByCategory.set(key, []);
      rulesByCategory.get(key)!.push(rule);
    }

    let totalPayments = 0;

    for (const employee of employees) {
      // Get quota assignments for this employee and month
      const quotas = await prisma.quotaAssignment.findMany({
        where: {
          employeeId: employee.id,
          month: monthDate,
        },
      });

      for (const quota of quotas) {
        // Get sales for this employee in this month for products in the category
        const category = await prisma.productCategory.findFirst({
          where: { name: quota.categoryName },
        });

        if (!category) continue;

        // Sum sales for this category
        const salesAgg = await prisma.saleRecord.aggregate({
          where: {
            employeeId: employee.id,
            date: { gte: monthStart, lte: monthEnd },
            product: { categoryId: category.id },
          },
          _sum: { totalAmount: true },
        });

        const salesAmount = salesAgg._sum.totalAmount || 0;
        const quotaAmount = quota.monthlyTarget;
        const fulfillmentPct = quotaAmount > 0 ? (salesAmount / quotaAmount) * 100 : 0;

        // Find applicable commission rule based on tier
        const categoryRules = rulesByCategory.get(quota.categoryName) || [];
        let commissionRate = 0;
        let commissionAmount = 0;

        for (const rule of categoryRules) {
          const minOk = fulfillmentPct >= rule.tierMinPct;
          const maxOk = rule.tierMaxPct === null || fulfillmentPct <= rule.tierMaxPct;

          if (minOk && maxOk) {
            commissionRate = rule.commissionPct;
            commissionAmount = (salesAmount * rule.commissionPct) / 100;
            if (rule.commissionFixed) {
              commissionAmount += rule.commissionFixed;
            }
            break;
          }
        }

        // Upsert commission payment
        await prisma.commissionPayment.upsert({
          where: {
            employeeId_month_categoryName: {
              employeeId: employee.id,
              month: monthDate,
              categoryName: quota.categoryName,
            },
          },
          update: {
            salesAmount,
            quotaAmount,
            fulfillmentPct,
            commissionRate,
            commissionAmount,
            status: "CALCULATED",
          },
          create: {
            employeeId: employee.id,
            month: monthDate,
            categoryName: quota.categoryName,
            salesAmount,
            quotaAmount,
            fulfillmentPct,
            commissionRate,
            commissionAmount,
            status: "CALCULATED",
          },
        });

        totalPayments++;
      }
    }

    return jsonResponse({
      calculated: totalPayments,
      month,
      employees: employees.length,
    });
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
