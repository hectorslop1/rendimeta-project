// =====================================================
// SUPABASE CLIENT (TEMPORAL - SOLO PARA DEMO)
// =====================================================
// Este archivo será reemplazado cuando migremos al backend real.
// Cuando migres, solo cambia este archivo por tu cliente REST/GraphQL.
// =====================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper para manejar errores de Supabase
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'Error en la operación');
}
