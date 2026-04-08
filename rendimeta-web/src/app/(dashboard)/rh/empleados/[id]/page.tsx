"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useEmployee, usePerformanceTrend } from "@/hooks/use-hr-data";
import { ClassificationBadge } from "@/components/domain/hr/classification-badge";
import { KpiCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmployeeAvatar } from "@/components/ui/employee-avatar";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  DollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const { data: employee, isLoading } = useEmployee(id);
  const { data: trendData, isLoading: isLoadingTrend } = usePerformanceTrend(id);

  const trendArr = useMemo(() => {
    if (!trendData) return [];
    if (Array.isArray(trendData)) return trendData;
    if (trendData.data && Array.isArray(trendData.data)) return trendData.data;
    return [];
  }, [trendData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium">Empleado no encontrado</p>
        <Link
          href="/rh/empleados"
          className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a empleados
        </Link>
      </div>
    );
  }

  const classification =
    employee.latestEvaluation?.classification ?? "NON_PRODUCTIVE";
  const fulfillmentPct =
    employee.latestEvaluation?.overallFulfillmentPct ?? 0;

  const attendanceData = [
    {
      name: "Presente",
      value: employee.attendanceStats?.PRESENT ?? 0,
      color: "#22c55e",
    },
    {
      name: "Tarde",
      value: employee.attendanceStats?.LATE ?? 0,
      color: "#f59e0b",
    },
    {
      name: "Ausente",
      value: employee.attendanceStats?.ABSENT ?? 0,
      color: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/rh/empleados"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a empleados
      </Link>

      {/* Header with Avatar */}
      <div className="flex flex-wrap items-start gap-6">
        <EmployeeAvatar
          firstName={employee.firstName}
          lastName={employee.lastName}
          photoUrl={employee.avatarUrl}
          size="xl"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="mt-1 text-lg text-gray-600 dark:text-gray-300">
                {employee.role?.name ?? "Sin rol"}
              </p>
            </div>
            <ClassificationBadge classification={classification} />
          </div>

          {/* Contact & Info */}
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4" />
              <span>{employee.email || "—"}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4" />
                <span>{employee.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span>{employee.station?.name ?? "Sin estación"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{employee.shift?.name ?? "Sin turno"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>
                Ingreso:{" "}
                {employee.hireDate
                  ? new Date(employee.hireDate).toLocaleDateString("es-MX")
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
              <span className="text-gray-600 dark:text-gray-400">#{employee.employeeNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2.5 dark:bg-indigo-900/30">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                % Cumplimiento
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                {formatPercent(fulfillmentPct)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/30">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Ventas (30d)
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                {formatCurrency(employee.recentSales?.totalAmount ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
              <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Racha Actual
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                {employee.currentStreak ?? 0} días
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-100 p-2.5 dark:bg-violet-900/30">
              <Award className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Puntos Totales
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                {(employee.totalPoints ?? 0).toLocaleString("es-MX")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Performance Trend */}
        {trendArr.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Tendencia de Desempeño
            </h2>
            {isLoadingTrend ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendArr}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v + "-01");
                      return d.toLocaleDateString("es-MX", {
                        month: "short",
                        year: "2-digit",
                      });
                    }}
                  />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: unknown) => formatPercent(Number(value))}
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fulfillmentPct"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#6366f1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* Attendance Stats */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Asistencia (30 días)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                {attendanceData.map((entry, index) => (
                  <Bar key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements */}
      {employee.achievements && employee.achievements.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Logros Recientes
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {employee.achievements.slice(0, 6).map((ach: any) => (
              <div
                key={ach.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50"
              >
                <div className="text-2xl">{ach.achievement?.iconEmoji ?? "🏆"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {ach.achievement?.name ?? "Logro"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(ach.earnedAt).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
