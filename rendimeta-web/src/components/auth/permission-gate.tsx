"use client";

import { useAuth } from "@/providers/auth-provider";
import type { ReactNode } from "react";

interface PermissionGateProps {
  minLevel: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  minLevel,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user || user.role.level < minLevel) return <>{fallback}</>;

  return <>{children}</>;
}
