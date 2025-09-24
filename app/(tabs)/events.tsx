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
      const { data: eventsData, error } = await supabase.rpc('get_user_events');
      if (error) throw error;

      const processedEvents = eventsData.map((event: any) => ({
        ...event,
        is_creator: event.creator_id === user.id,
      })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setEvents(processedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user]);

  // THE FIX: The function call here is now correct.
  const onRefresh = async () => {
    setLoading(true);
    await loadEvents();
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'created') return event.is_creator;
    if (activeTab === 'joined') return !event.is_creator;
    
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };
  
  const TabButton = ({ id, title }: { id: 'all' | 'created' | 'joined'; title: string }) => {
    const isActive = activeTab === id;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTab]}
        onPress={() => setActiveTab(id)}
      >
        <Text style={[styles.tabButtonText, isActive && styles.activeTabText]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/events/create')}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events by title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.tabs}>
          <TabButton id="all" title="All Events" />
          <TabButton id="created" title="Created" />
          <TabButton id="joined" title="Joined" />
        </View>
      </View>

      {/* Events List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#D4AF37']} />
        }
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No events found</Text>
            <Text style={styles.emptyStateSubtext}>
              {activeTab === 'all' && 'Create or join your first event!'}
              {activeTab === 'created' && 'You haven’t created any events yet.'}
              {activeTab === 'joined' && 'You haven’t joined any events yet.'}
            </Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => router.push(`/events/${event.id}`)}
            >
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                  <Text style={styles.statusText}>{event.status}</Text>
                </View>
              </View>
              <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              <View style={styles.eventFooter}>
                <View style={styles.participantInfo}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.participantCount}>
                    {event.participant_count || 0} participants
                  </Text>
                </View>
                {event.is_creator && (
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => router.push(`/events/${event.id}/manage`)}
                  >
                    <Settings size={16} color="#D4AF37" />
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  tabButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#D4AF37',
  },
  listContainer: {
    flex: 1,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
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
    marginBottom: 12,
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
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageButtonText: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
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
  },
});

