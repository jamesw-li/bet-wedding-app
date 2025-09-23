import { supabase } from '@/lib/supabase';

export class DatabaseService {
  // Event operations
  static async createEvent(eventData: {
    title: string;
    description?: string;
    date: string;
    creator_id: string;
  }) {
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('events')
      .insert([{ ...eventData, access_code: accessCode }])
      .select()
      .single();

    if (error) throw error;
    return { data, accessCode };
  }

  static async joinEvent(eventId: string, userId: string) {
    const { error } = await supabase
      .from('event_participants')
      .insert([{ event_id: eventId, user_id: userId }]);

    if (error) throw error;
  }

  static async getEventByAccessCode(accessCode: string) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('access_code', accessCode.toUpperCase())
      .single();

    if (error) throw error;
    return data;
  }

  // Bet operations
  static async placeBet(betData: {
    user_id: string;
    event_id: string;
    category_id: string;
    selected_option: string;
  }) {
    const { data, error } = await supabase
      .from('bets')
      .upsert([betData], { 
        onConflict: 'user_id,category_id',
        ignoreDuplicates: false 
      });

    if (error) throw error;
    return data;
  }

  static async getUserBets(userId: string, eventId: string) {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) throw error;
    return data || [];
  }

  // Category operations
  static async createBetCategory(categoryData: {
    event_id: string;
    title: string;
    description?: string;
    options: string[];
    points: number;
  }) {
    const { data, error } = await supabase
      .from('bet_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async settleBetCategory(categoryId: string, correctAnswer: string) {
    // Get category details for points calculation
    const { data: category, error: categoryError } = await supabase
      .from('bet_categories')
      .select('points')
      .eq('id', categoryId)
      .single();

    if (categoryError) throw categoryError;

    // Update category status to settled
    const { error: updateError } = await supabase
      .from('bet_categories')
      .update({ 
        status: 'settled' as const, 
        correct_answer: correctAnswer 
      })
      .eq('id', categoryId);

    if (updateError) throw updateError;

    // Update all bets for this category
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('category_id', categoryId);

    if (betsError) throw betsError;

    // Update each bet with correct/incorrect status and points
    for (const bet of bets || []) {
      const isCorrect = bet.selected_option === correctAnswer;
      const pointsEarned = isCorrect ? category.points : 0;

      await supabase
        .from('bets')
        .update({
          is_correct: isCorrect,
          points_earned: pointsEarned,
        })
        .eq('id', bet.id);
    }
  }

  // Leaderboard operations
  static async getEventLeaderboard(eventId: string) {
    const { data, error } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .order('total_points', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getGlobalLeaderboard() {
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        user_id,
        total_points,
        events!inner(title)
      `);

    if (error) throw error;
    
    // Aggregate points by user
    const userPointsMap = new Map();
    data?.forEach(participant => {
      const existing = userPointsMap.get(participant.user_id);
      if (existing) {
        existing.total_points += participant.total_points;
        existing.events_count += 1;
      } else {
        userPointsMap.set(participant.user_id, {
          user_id: participant.user_id,
          total_points: participant.total_points,
          events_count: 1,
        });
      }
    });

    return Array.from(userPointsMap.values())
      .sort((a, b) => b.total_points - a.total_points);
  }

  // Utility functions
  static async updateEventStatus(eventId: string, status: 'active' | 'completed' | 'cancelled') {
    const { error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', eventId);

    if (error) throw error;
  }

  static async getEventStats(eventId: string) {
    const [
      { count: participantCount },
      { count: betCount },
      { data: categories }
    ] = await Promise.all([
      supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId),
      supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId),
      supabase
        .from('bet_categories')
        .select('status')
        .eq('event_id', eventId)
    ]);

    const openCategories = categories?.filter(c => c.status === 'open').length || 0;
    const settledCategories = categories?.filter(c => c.status === 'settled').length || 0;

    return {
      participantCount: participantCount || 0,
      betCount: betCount || 0,
      openCategories,
      settledCategories,
      totalCategories: categories?.length || 0,
    };
  }
}