import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const stateId = url.searchParams.get("stateId") || undefined;
    const cityId = url.searchParams.get("cityId") || undefined;
    const search = url.searchParams.get("search") || undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { isActive: true };

    if (cityId) {
      where.cityId = cityId;
    } else if (stateId) {
      where.city = { stateId };
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const stations = await prisma.station.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        city: {
          include: {
            state: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = stations.map((s: any) => ({
      value: s.id,
      label: s.name,
      id: s.id,
      name: s.name,
      address: s.address,
      neighborhood: s.neighborhood,
      postalCode: s.postalCode,
      cityId: s.cityId,
      stateId: s.city.stateId,
      city: {
        id: s.city.id,
        name: s.city.name,
        stateId: s.city.stateId,
        state: {
          id: s.city.state.id,
          name: s.city.state.name,
          code: s.city.state.code,
        },
      },
      latitude: s.latitude,
      longitude: s.longitude,
      pumpCount: s.pumpCount,
      tankCount: s.tankCount,
      tankCapacityLiters: s.tankCapacityLiters,
      hasConvenienceStore: s.hasConvenienceStore,
      isActive: s.isActive,
    }));

    return jsonResponse({
      data,
      meta: { total: data.length },
    });
  } catch (error) {
    console.error("GET /api/stations error:", error);
    return errorResponse("Error al obtener estaciones", 500);
  }
}
