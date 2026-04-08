// =====================================================
// ITEMS API (Interfaz estable)
// =====================================================
// Esta interfaz NO cambiará cuando migres al backend real.
// Solo cambiarás la implementación interna.
// =====================================================

import { supabase, handleSupabaseError } from './client';
import type { Database } from './types';

type ItemRow = Database['public']['Tables']['items']['Row'];
type ItemInsert = Database['public']['Tables']['items']['Insert'];
type ItemUpdate = Database['public']['Tables']['items']['Update'];

export interface Item {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'active' | 'completed' | 'archived';
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemData {
  title: string;
  description?: string;
  status?: Item['status'];
  userId?: string;
}

export interface UpdateItemData {
  title?: string;
  description?: string;
  status?: Item['status'];
}

// =====================================================
// FUNCIONES PÚBLICAS (NO CAMBIARÁN)
// =====================================================

/**
 * Obtiene todos los items
 */
export async function getItems(): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(mapItemRowToItem);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Obtiene un item por ID
 */
export async function getItemById(id: string): Promise<Item> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return mapItemRowToItem(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Obtiene items por usuario
 */
export async function getItemsByUser(userId: string): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(mapItemRowToItem);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Crea un nuevo item
 */
export async function createItem(itemData: CreateItemData): Promise<Item> {
  try {
    const insertData: ItemInsert = {
      title: itemData.title,
      description: itemData.description || null,
      status: itemData.status || 'pending',
      user_id: itemData.userId || null,
    };

    const { data, error } = await supabase
      .from('items')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return mapItemRowToItem(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Actualiza un item existente
 */
export async function updateItem(
  id: string,
  updates: UpdateItemData
): Promise<Item> {
  try {
    const updateData: ItemUpdate = {
      title: updates.title,
      description: updates.description,
      status: updates.status,
    };

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapItemRowToItem(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Elimina un item
 */
export async function deleteItem(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Suscribirse a cambios en items (realtime)
 */
export function subscribeToItems(
  callback: (items: Item[]) => void
): () => void {
  const channel = supabase
    .channel('items-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'items',
      },
      async () => {
        // Refetch all items when any change occurs
        const items = await getItems();
        callback(items);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// =====================================================
// FUNCIONES INTERNAS (pueden cambiar)
// =====================================================

function mapItemRowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
