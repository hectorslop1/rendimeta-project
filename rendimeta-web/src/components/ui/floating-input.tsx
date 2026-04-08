"use client";

import { useState, InputHTMLAttributes } from "react";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

export function FloatingInput({ label, icon, className = "", ...props }: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200">
          {icon}
        </div>
      )}
      <input
        {...props}
        onChange={handleChange}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={`
          peer w-full rounded-lg border-2 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200
          ${icon ? "pl-11" : ""}
          ${isFocused ? "border-pink-500 ring-4 ring-pink-100" : "border-gray-300"}
          ${className}
        `}
        placeholder=" "
      />
      <label
        className={`
          absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-all duration-200 pointer-events-none
          ${icon ? "left-11" : "left-4"}
          ${isFocused || hasValue || props.value
            ? "-top-2 left-3 bg-white px-2 text-xs font-medium text-pink-600"
            : "text-gray-500"
          }
        `}
      >
        {label}
      </label>
    </div>
  );
}
