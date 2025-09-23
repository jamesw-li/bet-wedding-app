export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  creator_id: string;
  access_code: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BetCategory {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  options: string[];
  points: number;
  status: 'open' | 'closed' | 'settled';
  correct_answer?: string;
  created_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  event_id: string;
  category_id: string;
  selected_option: string;
  points_earned: number;
  is_correct?: boolean;
  created_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  total_points: number;
  joined_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  email?: string;
  total_points: number;
  events_participated: number;
  rank: number;
}

export interface EventStats {
  participantCount: number;
  betCount: number;
  openCategories: number;
  settledCategories: number;
  totalCategories: number;
}