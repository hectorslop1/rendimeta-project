import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: "asc" },
      include: {
        cities: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { stations: true },
            },
          },
        },
      },
    });

    const data = states.map((state: {
      id: string;
      name: string;
      code: string;
      cities: { id: string; name: string; _count: { stations: number } }[];
    }) => ({
      value: state.id,
      label: state.name,
      code: state.code,
      cityCount: state.cities.length,
      stationCount: state.cities.reduce(
        (sum: number, city: { _count: { stations: number } }) =>
          sum + city._count.stations,
        0
      ),
      cities: state.cities.map((city) => ({
        value: city.id,
        label: city.name,
        stationCount: city._count.stations,
      })),
    }));

    return jsonResponse({ data });
  } catch (error) {
    console.error("GET /api/states error:", error);
    return errorResponse("Error al obtener estados", 500);
  }
}
