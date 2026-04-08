"use client";

import { useState, useEffect } from "react";
import { getItems, createItem, updateItem, deleteItem, subscribeToItems, type Item } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";

export default function DemoPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState("");

  useEffect(() => {
    loadItems();

    const unsubscribe = subscribeToItems((updatedItems) => {
      setItems(updatedItems);
    });

    return () => unsubscribe();
  }, []);

  async function loadItems() {
    try {
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateItem() {
    if (!newItemTitle.trim() || !user) return;

    try {
      await createItem({
        title: newItemTitle,
        description: "Creado desde la app web",
        status: "pending",
        userId: user.id,
      });
      setNewItemTitle("");
    } catch (error) {
      console.error("Error creating item:", error);
    }
  }

  async function handleToggleStatus(item: Item) {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      await updateItem(item.id, { status: newStatus });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await deleteItem(id);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            🚀 Demo Supabase + Realtime
          </h1>
          <p className="text-gray-600">
            Los cambios se sincronizan automáticamente entre web y móvil
          </p>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Crear nuevo item
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
              placeholder="Título del item..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <button
              onClick={handleCreateItem}
              disabled={!newItemTitle.trim()}
              className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-2 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Crear
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Items ({items.length})
          </h2>

          {items.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No hay items. Crea uno para empezar.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-all hover:border-pink-300 hover:shadow-md"
                >
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${
                        item.status === "completed"
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          item.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : item.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-600"
                    >
                      {item.status === "completed" ? "Reabrir" : "Completar"}
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-white shadow-lg">
          <h3 className="mb-2 text-lg font-semibold">💡 Prueba esto:</h3>
          <ul className="space-y-1 text-sm">
            <li>✅ Crea un item aquí y míralo aparecer en la app móvil</li>
            <li>✅ Completa un item en móvil y míralo actualizarse aquí</li>
            <li>✅ Elimina un item desde cualquier app</li>
            <li>✅ Todo se sincroniza en tiempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
