import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

interface CrudConfig {
  model: string;
  include?: Record<string, unknown>;
  orderBy?: Record<string, string>;
  searchFields?: string[];
  writeMinLevel?: number;
  readMinLevel?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transformRow?: (row: any) => any;
}

function getModel(modelName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[modelName];
}

export function createCrudListHandler(config: CrudConfig) {
  return async function GET(request: Request) {
    try {
      const user = await validateSession();
      if (!user) return errorResponse("No autenticado", 401);
      if (config.readMinLevel && user.role.level < config.readMinLevel) {
        return errorResponse("Sin permisos", 403);
      }

      const url = new URL(request.url);
      const search = url.searchParams.get("search") || undefined;
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "100");
      const skip = (page - 1) * limit;

      const model = getModel(config.model);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {};
      if (search && config.searchFields) {
        where.OR = config.searchFields.map((field) => ({
          [field]: { contains: search, mode: "insensitive" },
        }));
      }

      const [rows, total] = await Promise.all([
        model.findMany({
          where,
          include: config.include,
          orderBy: config.orderBy || { createdAt: "desc" },
          skip,
          take: limit,
        }),
        model.count({ where }),
      ]);

      const data = config.transformRow ? rows.map(config.transformRow) : rows;

      return jsonResponse({ data, total, page, limit });
    } catch {
      return errorResponse("Error interno del servidor", 500);
    }
  };
}

export function createCrudCreateHandler(config: CrudConfig) {
  return async function POST(request: Request) {
    try {
      const user = await validateSession();
      if (!user) return errorResponse("No autenticado", 401);
      if (user.role.level < (config.writeMinLevel ?? 4)) {
        return errorResponse("Sin permisos", 403);
      }

      const body = await request.json();
      const model = getModel(config.model);

      const row = await model.create({
        data: body,
        include: config.include,
      });

      const data = config.transformRow ? config.transformRow(row) : row;
      return jsonResponse(data, 201);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error interno";
      return errorResponse(msg, 500);
    }
  };
}

export function createCrudDetailHandler(config: CrudConfig) {
  return async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await validateSession();
      if (!user) return errorResponse("No autenticado", 401);

      const { id } = await params;
      const model = getModel(config.model);

      const row = await model.findUnique({
        where: { id },
        include: config.include,
      });
      if (!row) return errorResponse("No encontrado", 404);

      const data = config.transformRow ? config.transformRow(row) : row;
      return jsonResponse(data);
    } catch {
      return errorResponse("Error interno del servidor", 500);
    }
  };
}

export function createCrudUpdateHandler(config: CrudConfig) {
  return async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await validateSession();
      if (!user) return errorResponse("No autenticado", 401);
      if (user.role.level < (config.writeMinLevel ?? 4)) {
        return errorResponse("Sin permisos", 403);
      }

      const { id } = await params;
      const body = await request.json();
      const model = getModel(config.model);

      const row = await model.update({
        where: { id },
        data: body,
        include: config.include,
      });

      const data = config.transformRow ? config.transformRow(row) : row;
      return jsonResponse(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error interno";
      return errorResponse(msg, 500);
    }
  };
}

export function createCrudDeleteHandler(config: CrudConfig) {
  return async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await validateSession();
      if (!user) return errorResponse("No autenticado", 401);
      if (user.role.level < (config.writeMinLevel ?? 4)) {
        return errorResponse("Sin permisos", 403);
      }

      const { id } = await params;
      const model = getModel(config.model);
      await model.delete({ where: { id } });

      return jsonResponse({ success: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error interno";
      return errorResponse(msg, 500);
    }
  };
}
