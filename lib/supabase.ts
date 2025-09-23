import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          date: string;
          creator_id: string;
          access_code: string;
          status: 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          date: string;
          creator_id: string;
          access_code: string;
          status?: 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          creator_id?: string;
          access_code?: string;
          status?: 'active' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
      bet_categories: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          description: string | null;
          options: string[];
          points: number;
          status: 'open' | 'closed' | 'settled';
          correct_answer: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          description?: string | null;
          options?: string[];
          points?: number;
          status?: 'open' | 'closed' | 'settled';
          correct_answer?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          description?: string | null;
          options?: string[];
          points?: number;
          status?: 'open' | 'closed' | 'settled';
          correct_answer?: string | null;
          created_at?: string;
        };
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          category_id: string;
          selected_option: string;
          points_earned: number;
          is_correct: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          category_id: string;
          selected_option: string;
          points_earned?: number;
          is_correct?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          category_id?: string;
          selected_option?: string;
          points_earned?: number;
          is_correct?: boolean | null;
          created_at?: string;
        };
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          total_points: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          total_points?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          total_points?: number;
          joined_at?: string;
        };
      };
    };
  };
};