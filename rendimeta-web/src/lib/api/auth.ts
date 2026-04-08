// =====================================================
// AUTH API (Interfaz estable)
// =====================================================
// Esta interfaz NO cambiará cuando migres al backend real.
// Solo cambiarás la implementación interna.
// =====================================================

import { supabase, handleSupabaseError } from './client';
import type { Database } from './types';

type User = Database['public']['Tables']['users']['Row'];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  station: string | null;
  role: string;
  level: number;
  stationIds: string[] | null;
  xp: number;
  streak: number;
  totalSales: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name: string;
  station?: string;
}

// =====================================================
// FUNCIONES PÚBLICAS (NO CAMBIARÁN)
// =====================================================

/**
 * Inicia sesión con email y password
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    // Obtener datos adicionales del usuario
    const userData = await getUserById(data.user.id);
    return userData;
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Cierra sesión
 */
export async function logout(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (!session?.user) return null;

    const userData = await getUserById(session.user.id);
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Registra un nuevo usuario
 */
export async function signup(data: SignupData): Promise<AuthUser> {
  try {
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user created');

    // Crear registro en tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        station: data.station || null,
        password_hash: '', // Supabase Auth maneja esto
      })
      .select()
      .single();

    if (userError) throw userError;

    return mapUserToAuthUser(userData);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Actualiza el perfil del usuario
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<User, 'name' | 'station'>>
): Promise<AuthUser> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return mapUserToAuthUser(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

// =====================================================
// FUNCIONES INTERNAS (pueden cambiar)
// =====================================================

async function getUserById(id: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  return mapUserToAuthUser(data);
}

function mapUserToAuthUser(user: User): AuthUser {
  return {
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
  };
}
