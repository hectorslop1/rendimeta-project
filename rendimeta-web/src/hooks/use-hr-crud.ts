"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

function createMutationHook<TBody>(
  url: string | ((body: TBody) => string),
  method: "POST" | "PUT" | "DELETE",
  invalidateKeys: string[]
) {
  return function useCrudMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (body: TBody) => {
        const resolvedUrl = typeof url === "function" ? url(body) : url;
        const res = await fetch(resolvedUrl, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Error en la operación");
        }
        return res.json();
      },
      onSuccess: () => {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      },
    });
  };
}

// Employees
export const useCreateEmployee = createMutationHook(
  "/api/hr/employees",
  "POST",
  ["hr-employees"]
);

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      queryClient.invalidateQueries({ queryKey: ["hr-employee"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hr/employees/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
    },
  });
}

// Roles
export const useCreateRole = createMutationHook(
  "/api/hr/roles",
  "POST",
  ["hr-roles"]
);

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-roles"] });
    },
  });
}

// Shifts
export const useCreateShift = createMutationHook(
  "/api/hr/shifts",
  "POST",
  ["hr-shifts"]
);

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/shifts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-shifts"] });
    },
  });
}

// Categories
export const useCreateCategory = createMutationHook(
  "/api/hr/categories",
  "POST",
  ["hr-categories"]
);

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-categories"] });
    },
  });
}

// Products
export const useCreateProduct = createMutationHook(
  "/api/hr/products",
  "POST",
  ["hr-products"]
);

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-products"] });
    },
  });
}

// Quota Templates
export const useCreateQuotaTemplate = createMutationHook(
  "/api/hr/quotas/templates",
  "POST",
  ["hr-quota-templates"]
);

export function useUpdateQuotaTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/quotas/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-quota-templates"] });
    },
  });
}

// Commission Rules
export const useCreateCommissionRule = createMutationHook(
  "/api/hr/commissions/rules",
  "POST",
  ["hr-commission-rules"]
);

export function useUpdateCommissionRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/commissions/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-commission-rules"] });
    },
  });
}

// Achievements
export const useCreateAchievement = createMutationHook(
  "/api/hr/gamification/achievements",
  "POST",
  ["hr-achievements"]
);

export function useUpdateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/hr/gamification/achievements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-achievements"] });
    },
  });
}

// Calculate Commissions
export const useCalculateCommissions = createMutationHook<{ month: string }>(
  "/api/hr/commissions/calculate",
  "POST",
  ["hr-commission-payments"]
);

// System Config
export function useUpdateSystemConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/hr/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-config"] });
    },
  });
}
