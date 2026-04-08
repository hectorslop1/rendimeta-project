"use client";

import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-400",
  "bg-lime-500",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName?.trim()?.[0] ?? "";
  const l = lastName?.trim()?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

interface EmployeeAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function EmployeeAvatar({
  firstName,
  lastName,
  photoUrl,
  size = "md",
  className,
}: EmployeeAvatarProps) {
  const initials = getInitials(firstName, lastName);
  const colorClass = getColorFromName(`${firstName} ${lastName}`);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={cn(
          "rounded-full object-cover ring-2 ring-white dark:ring-gray-800",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-gray-800",
        sizeMap[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
