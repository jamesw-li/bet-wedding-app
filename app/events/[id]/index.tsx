import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { ArrowLeft, Users, Calendar, Trophy, Target, Share, Settings } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type BetCategory = Database['public']['Tables']['bet_categories']['Row'];
type Bet = Database['public']['Tables']['bets']['Row'];
type EventParticipant = Database['public']['Tables']['event_participants']['Row'];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<BetCategory[]>([]);
  const [userBets, setUserBets] = useState<Record<string, Bet>>({});
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BetCategory | null>(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEventData = async () => {
    if (!user || !id) return;
    setLoading(true);
    try {
      // THE FIX: Call the new, secure database function to get all data at once.
      const { data, error } = await supabase
        .rpc('get_event_details', { event_id_to_check: id });
  
      if (error) throw error;
  
      // The data comes back as a single JSON object, so we parse it here.
      const eventData = data.event;
      const participantsData = data.participants || [];
      const categoriesData = data.categories || [];
      const betsData = data.bets || [];
  
      setEvent(eventData);
      setParticipants(participantsData.sort((a: EventParticipant, b: EventParticipant) => b.total_points - a.total_points));
      setCategories(categoriesData.sort((a: BetCategory, b: BetCategory) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      
      // Filter the bets to only show the current user's bets
      const userBetsMap = betsData.reduce((acc: any, bet: any) => {
        if(bet.user_id === user.id) acc[bet.category_id] = bet;
        return acc;
      }, {});
      setUserBets(userBetsMap);
  
    } catch (error: any) {
      console.error('Error loading event data:', error);
      Alert.alert('Error', 'Failed to load event data');
      router.back(); // Go back if there's an error (like access denied)
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

  const handlePlaceBet = async (categoryId: string, selectedOption: string) => {
    // ... (rest of the function is the same)
     if (!user || !event) return;
    try {
      const existingBet = userBets[categoryId];
      if (existingBet) {
        const { error } = await supabase.from('bets').update({ selected_option: selectedOption }).eq('id', existingBet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bets').insert([{ user_id: user.id, event_id: event.id, category_id: categoryId, selected_option: selectedOption }]);
        if (error) throw error;
      }
      setShowBetModal(false);
      await loadEventData();
      Alert.alert('Success', 'Your bet has been placed!');
    } catch (error: any) {
      console.error('Error placing bet:', error);
      Alert.alert('Error', error.message || 'Failed to place bet');
    }
  };

  const openBetModal = (category: BetCategory) => {
    // ... (rest of the function is the same)
    if (category.status !== 'open') {
      Alert.alert('Betting Closed', 'Betting is no longer available for this category.');
      return;
    }
    setSelectedCategory(category);
    setShowBetModal(true);
  };

  const shareEvent = () => {
    // ... (rest of the function is the same)
    Alert.alert('Share Event', `Access Code: ${event?.access_code}\n\nShare this code with others so they can join the event!`);
  };

  // THIS IS THE NEWLY ADDED FUNCTION WITH THE FIX
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC', // The crucial fix for the date being off-by-one
    });
  };

  const getStatusColor = (status: string) => {
    // ... (rest of the function is the same)
     switch (status) {
      case 'open': return '#10B981';
      case 'closed': return '#F59E0B';
      case 'settled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getBetStatusText = (category: BetCategory) => {
    // ... (rest of the function is the same)
    const userBet = userBets[category.id];
    if (category.status === 'settled') {
      if (userBet?.is_correct === true) {
        return `✅ Correct! +${userBet.points_earned} pts`;
      } else if (userBet?.is_correct === false) {
        return '❌ Incorrect';
      }
      return 'Not settled';
    }
    if (userBet) {
      return `Your bet: ${userBet.selected_option}`;
    }
    return 'No bet placed';
  };

  if (!event) {
    // ... (rest of the component is the same)
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  const isCreator = event.creator_id === user?.id;

  return (
    // ... The rest of the component and styles are the same
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={shareEvent}>
            <Share size={20} color="#6B7280" />
          </TouchableOpacity>
          {isCreator && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/events/${id}/manage`)}
            >
              <Settings size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#D4AF37']} />
        }
      >
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventDetail}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.eventDetailText}>{formatDate(event.date)}</Text>
              </View>
              <View style={styles.eventDetail}>
                <Users size={16} color="#6B7280" />
                <Text style={styles.eventDetailText}>
                  {participants.length} participants
                </Text>
              </View>
            </View>
            <View style={styles.accessCodeContainer}>
              <Text style={styles.accessCodeLabel}>Access Code</Text>
              <Text style={styles.accessCode}>{event.access_code}</Text>
            </View>
          </View>
          
          {event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Participants</Text>
          {participants.slice(0, 3).map((participant, index) => (
            <View key={participant.id} style={styles.participantCard}>
              <View style={styles.rankContainer}>
                <Text style={[styles.rank, index === 0 && styles.goldRank]}>
                  #{index + 1}
                </Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>
                  Participant {index + 1}
                  {participant.user_id === user?.id && ' (You)'}
                </Text>
              </View>
              <Text style={styles.participantPoints}>{participant.total_points} pts</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Betting Categories</Text>
          
          {categories.map((category) => {
            const userBet = userBets[category.id];
            const canBet = category.status === 'open';
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  !canBet && styles.categoryCardDisabled,
                  userBet && styles.categoryCardWithBet,
                ]}
                onPress={() => canBet && openBetModal(category)}
                disabled={!canBet}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <View style={styles.categoryMeta}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(category.status) }]}>
                      <Text style={styles.statusText}>{category.status}</Text>
                    </View>
                    <Text style={styles.categoryPoints}>{category.points} pts</Text>
                  </View>
                </View>
                
                {category.description && (
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                )}
                
                <View style={styles.categoryFooter}>
                  <Text style={[
                    styles.betStatus,
                    userBet?.is_correct === true && styles.correctBet,
                    userBet?.is_correct === false && styles.incorrectBet,
                  ]}>
                    {getBetStatusText(category)}
                  </Text>
                  
                  {canBet && (
                    <View style={styles.betAction}>
                      <Target size={16} color="#D4AF37" />
                      <Text style={styles.betActionText}>
                        {userBet ? 'Change Bet' : 'Place Bet'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={showBetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCategory && (
              <>
                <Text style={styles.modalTitle}>{selectedCategory.title}</Text>
                {selectedCategory.description && (
                  <Text style={styles.modalDescription}>{selectedCategory.description}</Text>
                )}
                
                <Text style={styles.modalSubtitle}>Select your bet:</Text>
                
                {selectedCategory.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      userBets[selectedCategory.id]?.selected_option === option && styles.selectedOption,
                    ]}
                    onPress={() => handlePlaceBet(selectedCategory.id, option)}
                  >
                    <Text style={[
                      styles.optionText,
                      userBets[selectedCategory.id]?.selected_option === option && styles.selectedOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowBetModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  accessCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
  },
  accessCodeLabel: {
    fontSize: 12,
    color: '#F57C00',
    marginBottom: 4,
  },
  accessCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 2,
  },
  eventDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  goldRank: {
    color: '#D4AF37',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardDisabled: {
    opacity: 0.7,
  },
  categoryCardWithBet: {
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  categoryMeta: {
    alignItems: 'flex-end',
    gap: 4,
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
  categoryPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  betStatus: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  correctBet: {
    color: '#10B981',
    fontWeight: '600',
  },
  incorrectBet: {
    color: '#EF4444',
    fontWeight: '600',
  },
  betAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  betActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#FFF8E1',
    borderColor: '#D4AF37',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
});