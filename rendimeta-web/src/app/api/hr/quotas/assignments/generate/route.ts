import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const user = await validateSession();
    if (!user) return errorResponse("No autenticado", 401);
    if (user.role.level < 4) return errorResponse("Sin permisos", 403);

    const body = await request.json();
    const { month, stationId } = body;

    if (!month || !stationId) {
      return errorResponse("Mes y estación son requeridos", 400);
    }

    const monthDate = new Date(month);

    // Get active templates matching the station (or templates with no station = global)
    const templates = await prisma.quotaTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { stationId },
          { stationId: null },
        ],
      },
      include: { category: true },
    });

    // Get active employees at the station
    const employees = await prisma.employee.findMany({
      where: {
        stationId,
        status: "ACTIVE",
      },
    });

    if (employees.length === 0) {
      return errorResponse("No hay empleados activos en esta estación", 400);
    }

    if (templates.length === 0) {
      return errorResponse("No hay plantillas de cuota activas para esta estación", 400);
    }

    // Calculate days in month for daily target
    const year = monthDate.getFullYear();
    const monthNum = monthDate.getMonth();
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

    const assignments = [];

    for (const template of templates) {
      // If template has a roleId filter, only assign to matching employees
      const targetEmployees = template.roleId
        ? employees.filter((e) => e.roleId === template.roleId)
        : employees;

      for (const employee of targetEmployees) {
        const dailyTarget = template.monthlyTarget / daysInMonth;

        try {
          const assignment = await prisma.quotaAssignment.upsert({
            where: {
              employeeId_month_categoryName: {
                employeeId: employee.id,
                month: monthDate,
                categoryName: template.category.name,
              },
            },
            update: {
              dailyTarget,
              monthlyTarget: template.monthlyTarget,
              templateId: template.id,
            },
            create: {
              employeeId: employee.id,
              templateId: template.id,
              month: monthDate,
              dailyTarget,
              monthlyTarget: template.monthlyTarget,
              categoryName: template.category.name,
            },
          });
          assignments.push(assignment);
        } catch {
          // Skip duplicates or errors for individual assignments
          continue;
        }
      }
    }

    return jsonResponse({
      generated: assignments.length,
      templates: templates.length,
      employees: employees.length,
    }, 201);
  } catch {
    return errorResponse("Error interno del servidor", 500);
  }
}
