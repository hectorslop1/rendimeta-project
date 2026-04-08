"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { User, LogOut, Key, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChangePasswordModal } from "./change-password-modal";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all hover:bg-pink-50 border border-transparent hover:border-pink-200"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-sm">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden max-w-[120px] truncate font-medium text-gray-700 md:block">
            {user.firstName}
          </span>
          <ChevronDown
            className={cn(
              "hidden h-4 w-4 text-gray-400 transition-transform md:block",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-100 bg-white py-2 shadow-xl animate-[scaleIn_0.15s_ease-out]">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="mt-0.5 text-xs font-medium text-pink-600">
                {user.role.name}
              </p>
              <p className="mt-1 truncate text-xs text-gray-500">
                {user.email}
              </p>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                setShowPasswordModal(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-pink-50"
            >
              <Key className="h-4 w-4 text-gray-400" />
              Cambiar contraseña
            </button>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}
