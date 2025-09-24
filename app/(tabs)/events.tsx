import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Plus, Search, Calendar, Users, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<(Event & { participant_count: number; is_creator: boolean })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'created' | 'joined'>('all');

  const loadEvents = async () => {
    if (!user) return;
    try {
      // THE FIX: Use the same two-step query process as the home screen.
      // Step 1: Get the events the user is allowed to see.
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');
      if (eventsError) throw eventsError;

      // Step 2: Get the participant counts for those events.
      const eventIds = eventsData.map(e => e.id);
      const { data: countsData, error: countsError } = await supabase
        .from('event_participants')
        .select('event_id, count', { count: 'exact' })
        .in('event_id', eventIds);
      if (countsError) throw countsError;
        
      const participantCounts = new Map<string, number>();
      countsData.forEach(item => {
        participantCounts.set(item.event_id, item.count ?? 0);
      });

      // Combine the data in the app
      const processedEvents = eventsData.map(event => ({
        ...event,
        participant_count: participantCounts.get(event.id) || 0,
        is_creator: event.creator_id === user.id,
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setEvents(processedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [user]);
  const onRefresh = async () => { setLoading(true); await loadEvents(); };
  const filteredEvents = events.filter(event => { /* ... (This logic is correct) ... */ });
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const getStatusColor = (status: string) => { /* ... */ };
  const TabButton = ({ id, title, isActive }: { id: string; title: string; isActive: boolean }) => { /* ... */ };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/events/create')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton id="all" title="All Events" isActive={activeTab === 'all'} />
        <TabButton id="created" title="Created" isActive={activeTab === 'created'} />
        <TabButton id="joined" title="Joined" isActive={activeTab === 'joined'} />
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#D4AF37']} />
        }
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>
              {activeTab === 'created' && 'No events created yet'}
              {activeTab === 'joined' && 'No events joined yet'}
              {activeTab === 'all' && 'No events found'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'created' && 'Create your first wedding betting event!'}
              {activeTab === 'joined' && 'Join an event using an access code.'}
              {activeTab === 'all' && 'Try adjusting your search or create a new event.'}
            </Text>
            {(activeTab === 'created' || activeTab === 'all') && (
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => router.push('/events/create')}
              >
                <Text style={styles.emptyActionButtonText}>Create Event</Text>
              </TouchableOpacity>
            )}
            {(activeTab === 'joined' || activeTab === 'all') && (
              <TouchableOpacity
                style={styles.emptyActionButtonSecondary}
                onPress={() => router.push('/events/join')}
              >
                <Text style={styles.emptyActionButtonTextSecondary}>Join Event</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => router.push(`/events/${event.id}`)}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventHeaderRight}>
                  {event.is_creator && (
                    <TouchableOpacity
                      style={styles.settingsButton}
                      onPress={() => router.push(`/events/${event.id}/manage`)}
                    >
                      <Settings size={16} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                    <Text style={styles.statusText}>{event.status}</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              
              {event.description && (
                <Text style={styles.eventDescription} numberOfLines={2}>
                  {event.description}
                </Text>
              )}
              
              <View style={styles.eventFooter}>
                <View style={styles.participantInfo}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.participantCount}>
                    {event.participant_count || 0} participants
                  </Text>
                </View>
                
                <Text style={styles.roleLabel}>
                  {event.is_creator ? 'Creator' : 'Participant'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/events/join')}
      >
        <Users size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  createButton: {
    backgroundColor: '#D4AF37',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTabButton: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  tabButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  eventHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    padding: 4,
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
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleLabel: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyActionButtonSecondary: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  emptyActionButtonTextSecondary: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#10B981',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});