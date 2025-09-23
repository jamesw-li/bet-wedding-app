import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { ArrowLeft, Users, Trophy, Target, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type BetCategory = Database['public']['Tables']['bet_categories']['Row'];
type Bet = Database['public']['Tables']['bets']['Row'] & {
  participant_email?: string;
};

export default function ManageEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<BetCategory[]>([]);
  const [allBets, setAllBets] = useState<Record<string, Bet[]>>({});
  const [loading, setLoading] = useState(true);

  const loadEventData = async () => {
    if (!user || !id) return;

    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      
      // Check if user is the creator
      if (eventData.creator_id !== user.id) {
        Alert.alert('Access Denied', 'You are not the creator of this event.');
        router.back();
        return;
      }

      setEvent(eventData);

      // Load bet categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('bet_categories')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load all bets for this event
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('event_id', id);

      if (betsError) throw betsError;

      // Group bets by category
      const betsByCategory = (betsData || []).reduce((acc, bet) => {
        if (!acc[bet.category_id]) {
          acc[bet.category_id] = [];
        }
        acc[bet.category_id].push(bet);
        return acc;
      }, {} as Record<string, Bet[]>);

      setAllBets(betsByCategory);

    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert('Error', 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [user, id]);

  const onRefresh = async () => {
    setLoading(true);
    await loadEventData();
  };

  const toggleCategoryStatus = async (categoryId: string, newStatus: 'open' | 'closed') => {
    try {
      const { error } = await supabase
        .from('bet_categories')
        .update({ status: newStatus })
        .eq('id', categoryId);

      if (error) throw error;

      await loadEventData();
      Alert.alert('Success', `Betting has been ${newStatus === 'open' ? 'opened' : 'closed'} for this category.`);
    } catch (error: any) {
      console.error('Error updating category status:', error);
      Alert.alert('Error', error.message || 'Failed to update betting status');
    }
  };

  const settleBet = async (categoryId: string, correctAnswer: string) => {
    Alert.alert(
      'Settle Bets',
      `Are you sure you want to settle this category with the answer: "${correctAnswer}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update category with correct answer and settled status
              const { error: categoryError } = await supabase
                .from('bet_categories')
                .update({ 
                  correct_answer: correctAnswer, 
                  status: 'settled' 
                })
                .eq('id', categoryId);

              if (categoryError) throw categoryError;

              // Get the category points
              const category = categories.find(c => c.id === categoryId);
              const points = category?.points || 0;

              // Update bets with correct/incorrect status and points
              const bets = allBets[categoryId] || [];
              
              for (const bet of bets) {
                const isCorrect = bet.selected_option === correctAnswer;
                const pointsEarned = isCorrect ? points : 0;

                const { error: betError } = await supabase
                  .from('bets')
                  .update({
                    is_correct: isCorrect,
                    points_earned: pointsEarned,
                  })
                  .eq('id', bet.id);

                if (betError) throw betError;
              }

              await loadEventData();
              Alert.alert('Success', 'Bets have been settled successfully!');
            } catch (error: any) {
              console.error('Error settling bets:', error);
              Alert.alert('Error', error.message || 'Failed to settle bets');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#10B981';
      case 'closed':
        return '#F59E0B';
      case 'settled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getBetSummary = (categoryId: string) => {
    const bets = allBets[categoryId] || [];
    const totalBets = bets.length;
    
    if (totalBets === 0) return 'No bets placed';

    // Count bets by option
    const optionCounts = bets.reduce((acc, bet) => {
      acc[bet.selected_option] = (acc[bet.selected_option] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topOption = Object.entries(optionCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return `${totalBets} bet${totalBets !== 1 ? 's' : ''} • Most popular: ${topOption?.[0] || 'None'} (${topOption?.[1] || 0})`;
  };

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Event</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#D4AF37']} />
        }
      >
        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
          <View style={styles.accessCodeContainer}>
            <Text style={styles.accessCodeLabel}>Access Code:</Text>
            <Text style={styles.accessCode}>{event.access_code}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={24} color="#10B981" />
            <Text style={styles.statNumber}>
              {Object.values(allBets).flat().length}
            </Text>
            <Text style={styles.statLabel}>Total Bets</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {categories.filter(c => c.status === 'open').length}
            </Text>
            <Text style={styles.statLabel}>Open Categories</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color="#6B7280" />
            <Text style={styles.statNumber}>
              {categories.filter(c => c.status === 'settled').length}
            </Text>
            <Text style={styles.statLabel}>Settled</Text>
          </View>
        </View>

        {/* Categories Management */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Betting Categories</Text>
          
          {categories.map((category) => {
            const bets = allBets[category.id] || [];
            const isOpen = category.status === 'open';
            const isSettled = category.status === 'settled';
            
            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryBetCount}>{getBetSummary(category.id)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(category.status) }]}>
                    <Text style={styles.statusText}>{category.status}</Text>
                  </View>
                </View>

                {category.description && (
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                )}

                {/* Betting Options with Results */}
                <View style={styles.optionsContainer}>
                  {category.options.map((option) => {
                    const optionBets = bets.filter(bet => bet.selected_option === option);
                    const isCorrect = category.correct_answer === option;
                    
                    return (
                      <View key={option} style={[
                        styles.optionRow,
                        isCorrect && styles.correctOption,
                      ]}>
                        <Text style={[styles.optionText, isCorrect && styles.correctOptionText]}>
                          {option}
                        </Text>
                        <Text style={styles.optionCount}>
                          {optionBets.length} bet{optionBets.length !== 1 ? 's' : ''}
                        </Text>
                        {isCorrect && <CheckCircle size={16} color="#10B981" />}
                      </View>
                    );
                  })}
                </View>

                {/* Actions */}
                <View style={styles.categoryActions}>
                  {!isSettled && (
                    <View style={styles.toggleContainer}>
                      <Text style={styles.toggleLabel}>Betting Open:</Text>
                      <Switch
                        value={isOpen}
                        onValueChange={(value) => 
                          toggleCategoryStatus(category.id, value ? 'open' : 'closed')
                        }
                        trackColor={{ false: '#D1D5DB', true: '#D4AF37' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  )}

                  {category.status === 'closed' && (
                    <View style={styles.settleContainer}>
                      <Text style={styles.settleLabel}>Settle with correct answer:</Text>
                      <View style={styles.settleOptions}>
                        {category.options.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={styles.settleOption}
                            onPress={() => settleBet(category.id, option)}
                          >
                            <Text style={styles.settleOptionText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {isSettled && (
                    <View style={styles.settledInfo}>
                      <CheckCircle size={20} color="#10B981" />
                      <Text style={styles.settledText}>
                        Settled with answer: {category.correct_answer}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  eventCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  accessCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  accessCodeLabel: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
  accessCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryBetCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 4,
  },
  correctOption: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  optionText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  correctOptionText: {
    fontWeight: '600',
    color: '#10B981',
  },
  optionCount: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  categoryActions: {
    gap: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settleContainer: {
    gap: 12,
  },
  settleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settleOption: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  settleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  settledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
});