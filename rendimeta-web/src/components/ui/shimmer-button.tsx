"use client";

import { ButtonHTMLAttributes } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ShimmerButton({ children, className = "", ...props }: ShimmerButtonProps) {
  return (
    <button
      {...props}
      className={`
        group relative overflow-hidden rounded-lg bg-gradient-to-r from-[#E6007A] to-[#7A28FF] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition-all duration-300
        hover:shadow-xl hover:shadow-pink-500/40 hover:scale-[1.02]
        disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
