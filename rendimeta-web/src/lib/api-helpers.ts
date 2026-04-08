import { prisma } from "@/lib/prisma";

/**
 * Parse common filter query params from a request URL.
 */
export function parseFilters(url: URL) {
  const stateId = url.searchParams.get("stateId") || undefined;
  const cityId = url.searchParams.get("cityId") || undefined;
  const stationId = url.searchParams.get("stationId") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const period = (url.searchParams.get("period") || "day") as
    | "day"
    | "week"
    | "month";
  const groupBy = (url.searchParams.get("groupBy") || undefined) as
    | "station"
    | "city"
    | "state"
    | undefined;

  return { stateId, cityId, stationId, from, to, period, groupBy };
}

/**
 * Build a Prisma `where` clause for KPI tables that share
 * stationId + date columns plus station->city->state relations.
 */
export function buildKpiWhere(filters: ReturnType<typeof parseFilters>) {
  const { stateId, cityId, stationId, from, to } = filters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (stationId) {
    where.stationId = stationId;
  } else if (cityId) {
    where.station = { cityId };
  } else if (stateId) {
    where.station = { city: { stateId } };
  }

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  return where;
}

/**
 * Build a Prisma `where` clause to select the "previous period" of equal
 * length, ending one day before `from`.
 */
export function buildPreviousPeriodWhere(
  filters: ReturnType<typeof parseFilters>
) {
  const { from, to } = filters;
  if (!from || !to) return buildKpiWhere(filters);

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diff = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1); // day before from
  const prevFrom = new Date(prevTo.getTime() - diff);

  return buildKpiWhere({
    ...filters,
    from: prevFrom.toISOString().slice(0, 10),
    to: prevTo.toISOString().slice(0, 10),
  });
}

/**
 * Get station IDs matching the location filters.
 */
export async function getFilteredStationIds(
  filters: ReturnType<typeof parseFilters>
): Promise<string[] | undefined> {
  const { stateId, cityId, stationId } = filters;

  if (stationId) return [stationId];

  if (cityId || stateId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stationWhere: Record<string, any> = {};
    if (cityId) stationWhere.cityId = cityId;
    else if (stateId) stationWhere.city = { stateId };

    const stations = await prisma.station.findMany({
      where: stationWhere,
      select: { id: true },
    });
    return stations.map((s: { id: string }) => s.id);
  }

  return undefined; // no filter — all stations
}

export function jsonResponse<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ message }, { status });
}
