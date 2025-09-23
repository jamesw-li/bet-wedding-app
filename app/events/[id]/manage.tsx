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
  Platform, // Import Platform
} from 'react-native';
import { ArrowLeft, Users, Trophy, Target, CheckCircle } from 'lucide-react-native';
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
  
  // 1. Add new state to manage the inline confirmation UI
  const [confirmingSettle, setConfirmingSettle] = useState<{ categoryId: string; option: string } | null>(null);

  const loadEventData = async () => { /* ... (this function remains the same) ... */ };
  useEffect(() => { loadEventData(); }, [user, id]);
  const onRefresh = async () => { /* ... (this function remains the same) ... */ };
  const toggleCategoryStatus = async (categoryId: string, newStatus: 'open' | 'closed') => { /* ... */ };
  const formatDate = (dateString: string) => { /* ... */ };
  const getStatusColor = (status: string) => { /* ... */ };
  const getBetSummary = (categoryId: string) => { /* ... */ };

  // 2. Simplify the settleBet function to only contain the core logic
  const settleAction = async (categoryId: string, correctAnswer: string) => {
    try {
      const { error } = await supabase.rpc('settle_bet', {
        category_id_to_settle: categoryId,
        correct_answer_option: correctAnswer,
        creator_id_to_check: user!.id,
      });

      if (error) throw error;

      await loadEventData();
      alert('Success! Bets have been settled.'); 
    } catch (error: any) {
      console.error('Error settling bets:', error);
      Alert.alert('Error', error.message || 'Failed to settle bets');
    } finally {
      // Reset the confirmation state
      setConfirmingSettle(null);
    }
  };

  // 3. Create a new handler to manage the confirmation flow
  const handleSettlePress = (categoryId: string, correctAnswer: string) => {
    if (Platform.OS === 'web') {
      // On web, show the inline confirmation UI
      setConfirmingSettle({ categoryId, option: correctAnswer });
    } else {
      // On mobile, use the native Alert for confirmation
      Alert.alert(
        'Settle Bets',
        `Settle with the answer: "${correctAnswer}"?\nThis cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settle', style: 'destructive', onPress: () => settleAction(categoryId, correctAnswer) },
        ]
      );
    }
  };

  if (!event) { /* ... (loading view remains the same) ... */ }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Event</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#D4AF37']} />}
      >
        {/* ... (Event Card and Stats Container remain the same) ... */}
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Betting Categories</Text>
          
          {categories.map((category) => {
            const isConfirmingThisCategory = confirmingSettle?.categoryId === category.id;
            
            return (
              <View key={category.id} style={styles.categoryCard}>
                {/* ... (Category Header and Description remain the same) ... */}

                {category.status === 'closed' && (
                  <View style={styles.settleContainer}>
                    <Text style={styles.settleLabel}>Settle with correct answer:</Text>
                    <View style={styles.settleOptions}>
                      {/* 4. Conditionally render either the options or the confirmation UI */}
                      {isConfirmingThisCategory ? (
                        <View style={styles.confirmationContainer}>
                          <Text style={styles.confirmationText}>Settle with "{confirmingSettle.option}"?</Text>
                          <View style={styles.confirmationActions}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmingSettle(null)}>
                              <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmButton} onPress={() => settleAction(confirmingSettle.categoryId, confirmingSettle.option)}>
                              <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        category.options.map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={styles.settleOption}
                            onPress={() => handleSettlePress(category.id, option)}
                          >
                            <Text style={styles.settleOptionText}>{option}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </View>
                )}
                
                {/* ... (Rest of the category card logic remains the same) ... */}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// 5. Add new styles for the inline confirmation UI
const styles = StyleSheet.create({
  // ... (all other styles remain the same)
  confirmationContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 12,
  },
  confirmationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // --- (existing styles below for context) ---
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1 },
  sectionContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  categoryCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  settleContainer: { gap: 12, marginTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  settleLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  settleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  settleOption: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D4AF37' },
  settleOptionText: { fontSize: 14, fontWeight: '600', color: '#92400E' },
});