// =====================================================
// DATABASE TYPES
// =====================================================
// Tipos generados automáticamente desde el esquema de Supabase
// Cuando migres, estos tipos vendrán de tu backend real
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          name: string;
          station: string | null;
          role: string;
          level: number;
          station_ids: string[] | null;
          xp: number;
          streak: number;
          total_sales: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          station?: string | null;
          role?: string;
          level?: number;
          station_ids?: string[] | null;
          xp?: number;
          streak?: number;
          total_sales?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          station?: string | null;
          role?: string;
          level?: number;
          station_ids?: string[] | null;
          xp?: number;
          streak?: number;
          total_sales?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: 'pending' | 'active' | 'completed' | 'archived';
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: 'pending' | 'active' | 'completed' | 'archived';
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: 'pending' | 'active' | 'completed' | 'archived';
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          tier: 'bronze' | 'silver' | 'gold';
          icon: string;
          created_at: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          unlocked: boolean;
          unlocked_at: string | null;
          created_at: string;
        };
      };
      daily_missions: {
        Row: {
          id: string;
          description: string;
          product_type: 'aceite' | 'snack' | 'accesorio' | 'aromatizante' | 'other' | null;
          target: number;
          xp_reward: number;
          active: boolean;
          created_at: string;
        };
      };
      user_missions: {
        Row: {
          id: string;
          user_id: string;
          mission_id: string;
          current: number;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_id: string;
          current?: number;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          current?: number;
          completed?: boolean;
          completed_at?: string | null;
        };
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          product_type: 'aceite' | 'snack' | 'accesorio' | 'aromatizante' | 'other';
          quantity: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_type: 'aceite' | 'snack' | 'accesorio' | 'aromatizante' | 'other';
          quantity?: number;
          notes?: string | null;
          created_at?: string;
        };
      };
      training_videos: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          duration: string;
          xp_reward: number;
          accent_color: string | null;
          video_url: string | null;
          created_at: string;
        };
      };
      user_training: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
        };
      };
    };
  };
}
