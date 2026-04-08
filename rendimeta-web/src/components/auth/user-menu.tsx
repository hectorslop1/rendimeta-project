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
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden max-w-[120px] truncate text-gray-700 dark:text-gray-300 md:block">
            {user.firstName}
          </span>
          <ChevronDown
            className={cn(
              "hidden h-3.5 w-3.5 text-gray-400 transition-transform md:block",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role.name}
              </p>
              <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                {user.email}
              </p>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                setShowPasswordModal(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Key className="h-4 w-4" />
              Cambiar contraseña
            </button>

            <div className="border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
