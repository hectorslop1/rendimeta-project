// =====================================================
// API EXPORTS (Punto de entrada único)
// =====================================================
// Importa desde aquí en tus componentes:
// import { login, getItems, createItem } from '@/lib/api'
// =====================================================

export * from './auth';
export * from './items';
export * from './users';
export { supabase } from './client';
