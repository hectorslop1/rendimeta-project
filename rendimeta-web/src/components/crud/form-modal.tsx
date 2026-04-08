"use client";

import type { ReactNode, FormEvent } from "react";
import { Loader2, X } from "lucide-react";

interface FormModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  loading?: boolean;
  error?: string;
  children: ReactNode;
}

export function FormModal({
  title,
  open,
  onClose,
  onSubmit,
  loading = false,
  error,
  children,
}: FormModalProps) {
  if (!open) return null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    onSubmit(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-[color:var(--app-panel-border)] bg-[color:var(--app-panel-bg)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[color:var(--muted-foreground)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {children}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--app-hover-bg)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[color:var(--app-primary-strong)] px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
