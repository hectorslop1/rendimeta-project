"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  useGamificationScores,
  useEmployeeAchievements,
  useEmployee,
} from "@/hooks/use-hr-data";
import { EmployeeScoreRing } from "@/components/domain/hr/employee-score-ring";
import { AchievementGallery } from "@/components/domain/hr/achievement-gallery";
import { StreakIndicator } from "@/components/domain/hr/streak-indicator";
import { Skeleton, KpiCardSkeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trophy, Flame, Target, Loader2 } from "lucide-react";

export default function GamificacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const { data: employee, isLoading: isLoadingEmp } = useEmployee(id);
  const { data: scores, isLoading: isLoadingScores } = useGamificationScores(id);
  const { data: achievements, isLoading: isLoadingAch } =
    useEmployeeAchievements(id);

  const scoresArr = useMemo(
    () => (Array.isArray(scores) ? scores : []),
    [scores]
  );
  const achievementsArr = useMemo(
    () => (Array.isArray(achievements) ? achievements : []),
    [achievements]
  );

  const selectedScore = useMemo(() => {
    return scoresArr.find((s: any) => s.employee?.id === id) ?? scoresArr[0] ?? null;
  }, [id, scoresArr]);

  const earnedCount = achievementsArr.filter((a: any) => a.earned).length;
  const totalAch = achievementsArr.length;
  const earnedPoints = achievementsArr
    .filter((a: any) => a.earned)
    .reduce((s: number, a: any) => s + (a.pointValue ?? 0), 0);

  if (isLoadingEmp) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[color:var(--muted-foreground)]">
        <p className="text-lg font-medium">Empleado no encontrado</p>
        <Link
          href="/rh/gamificacion"
          className="mt-4 inline-flex items-center gap-2 text-sm text-[color:var(--app-primary-strong)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a gamificacion
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/rh/gamificacion"
        className="inline-flex items-center gap-2 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--app-table-row-text)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a gamificacion
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-lg font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
          {employee.firstName?.[0]}{employee.lastName?.[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--app-title-color)]">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            #{employee.employeeNumber} &middot; {employee.station?.name ?? "Sin estacion"}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      {(isLoadingScores || selectedScore) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
              <Trophy className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-[color:var(--muted-foreground)]">Logros</p>
              <p className="text-xl font-bold text-[color:var(--app-title-color)]">
                {earnedCount}<span className="text-sm font-normal text-[color:var(--muted-foreground)]">/{totalAch}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-[color:var(--muted-foreground)]">Racha</p>
              <p className="text-xl font-bold text-[color:var(--app-title-color)]">
                {selectedScore?.currentStreak ?? 0} <span className="text-sm font-normal text-[color:var(--muted-foreground)]">dias</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-[color:var(--muted-foreground)]">Pts Logros</p>
              <p className="text-xl font-bold text-[color:var(--app-title-color)]">
                {earnedPoints}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Score Ring */}
      {selectedScore && (
        <div className="rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[color:var(--app-title-color)]">
            Desglose de Puntos
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

      {!selectedScore && !isLoadingScores && (
        <div className="rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-8 text-center">
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Sin datos de puntuacion para este mes
          </p>
        </div>
      )}

      {/* Achievements */}
      {isLoadingAch ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--app-primary-strong)]" />
        </div>
      ) : achievementsArr.length > 0 ? (
        <div className="rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-6">
          <h2 className="mb-2 text-sm font-semibold text-[color:var(--app-title-color)]">
            Logros
          </h2>
          <AchievementGallery achievements={achievementsArr} />
        </div>
      ) : null}
    </div>
  );
}
