// =====================================================
// USERS API (Interfaz estable)
// =====================================================

import { supabase, handleSupabaseError } from './client';
import type { AuthUser } from './auth';

/**
 * Obtiene todos los usuarios
 */
export async function getUsers(): Promise<AuthUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;

    return data.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      station: user.station,
      role: user.role,
      level: user.level,
      stationIds: user.station_ids,
      xp: user.xp,
      streak: user.streak,
      totalSales: user.total_sales,
    }));
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Actualiza XP del usuario
 */
export async function updateUserXP(
  userId: string,
  xpToAdd: number
): Promise<void> {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('xp')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('users')
      .update({ xp: user.xp + xpToAdd })
      .eq('id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    handleSupabaseError(error);
  }
}
