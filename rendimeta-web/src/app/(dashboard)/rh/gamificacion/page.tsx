"use client";

import { useState, useMemo } from "react";
import { useGamificationScores, useAchievements, useEmployees } from "@/hooks/use-hr-data";
import { EmployeeScoreRing } from "@/components/domain/hr/employee-score-ring";
import { AchievementGallery } from "@/components/domain/hr/achievement-gallery";
import { StreakIndicator } from "@/components/domain/hr/streak-indicator";
import { Loader2, Gamepad2 } from "lucide-react";

export default function GamificacionPage() {
  const [employeeId, setEmployeeId] = useState("");

  const { data: employees } = useEmployees({});
  const { data: scores, isLoading: isLoadingScores } = useGamificationScores(
    employeeId || undefined
  );
  const { data: achievements, isLoading: isLoadingAch } = useAchievements();

  const employeesArr = useMemo(() => {
    if (!employees) return [];
    return Array.isArray(employees) ? employees : employees?.data ?? [];
  }, [employees]);

  const scoresArr = useMemo(
    () => (Array.isArray(scores) ? scores : []),
    [scores]
  );
  const achievementsArr = useMemo(
    () => (Array.isArray(achievements) ? achievements : []),
    [achievements]
  );

  // Selected employee score
  const selectedScore = useMemo(() => {
    if (!employeeId) return null;
    return scoresArr.find((s: any) => s.employee?.id === employeeId) ?? null;
  }, [employeeId, scoresArr]);

  // Top 10 by total points
  const top10 = useMemo(() => {
    return [...scoresArr]
      .sort((a: any, b: any) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
      .slice(0, 10);
  }, [scoresArr]);

  // Build gallery: match earned achievements
  const gallery = useMemo(() => {
    return achievementsArr.map((ach: any) => ({
      ...ach,
      earned: false, // Will be updated with employee data in production
      earnedAt: undefined,
    }));
  }, [achievementsArr]);

  const selectClass =
    "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Gamificacion
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Puntos, logros y rachas de empleados
        </p>
      </div>

      {/* Employee Selector */}
      <div className="w-80">
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Empleado
        </label>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className={selectClass + " w-full"}
        >
          <option value="">Seleccionar empleado...</option>
          {employeesArr.map((e: any) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {(isLoadingScores || isLoadingAch) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        </div>
      )}

      {/* Selected employee ring */}
      {employeeId && selectedScore && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Score de{" "}
            {selectedScore.employee?.firstName}{" "}
            {selectedScore.employee?.lastName}
          </h2>
          <div className="flex flex-wrap items-center gap-8">
            <EmployeeScoreRing
              totalPoints={selectedScore.totalPoints ?? 0}
              salesPoints={selectedScore.salesPoints ?? 0}
              attendancePoints={selectedScore.attendancePoints ?? 0}
              streakPoints={selectedScore.streakPoints ?? 0}
              bonusPoints={selectedScore.bonusPoints ?? 0}
            />
            <StreakIndicator
              current={selectedScore.currentStreak ?? 0}
              best={selectedScore.bestStreak ?? 0}
            />
          </div>
        </div>
      )}

      {employeeId && !selectedScore && !isLoadingScores && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Gamepad2 className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">
            Sin datos de gamificacion para este empleado
          </p>
        </div>
      )}

      {/* Top 10 */}
      {top10.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Top 10 por Puntos Totales
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["#", "Empleado", "Puntos", "Ventas", "Asistencia", "Racha", "Bonos"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {top10.map((s: any, idx: number) => (
                  <tr
                    key={s.id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {s.employee?.firstName} {s.employee?.lastName}
                    </td>
                    <td className="px-3 py-2 font-bold text-rose-600 dark:text-rose-400">
                      {(s.totalPoints ?? 0).toLocaleString("es-MX")}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {(s.salesPoints ?? 0).toLocaleString("es-MX")}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {(s.attendancePoints ?? 0).toLocaleString("es-MX")}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {(s.streakPoints ?? 0).toLocaleString("es-MX")}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {(s.bonusPoints ?? 0).toLocaleString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Achievement Gallery */}
      {gallery.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Galeria de Logros
          </h2>
          <AchievementGallery achievements={gallery} />
        </div>
      )}
    </div>
  );
}
