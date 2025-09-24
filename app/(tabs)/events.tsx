import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Plus, Calendar, Users, TrendingUp, Trophy } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export default function HomeScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<(Event & { participant_count: number })[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalBets: 0,
    totalPoints: 0,
  });
  const [loading, setLoading] = useState(true);

  // Inside the EventsScreen component in app/(tabs)/events.tsx

  const loadEvents = async () => {
    if (!user) return;
    try {
      // THE FIX: Use the same secure database function here as well.
      const { data: eventsData, error } = await supabase.rpc('get_user_events');
      if (error) throw error;
  
      const processedEvents = eventsData.map(event => ({
        ...event,
        is_creator: event.creator_id === user.id,
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
      setEvents(processedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);
  const onRefresh = async () => { setLoading(true); await loadData(); };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#D4AF37']} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Calendar size={24} color="#D4AF37" />
          <Text style={styles.statNumber}>{stats.totalEvents}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#D4AF37" />
          <Text style={styles.statNumber}>{stats.totalBets}</Text>
          <Text style={styles.statLabel}>Bets Placed</Text>
        </View>
        <View style={styles.statCard}>
          <Trophy size={24} color="#D4AF37" />
          <Text style={styles.statNumber}>{stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/events/create')}>
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Create Event</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => router.push('/events/join')}>
          <Users size={24} color="#D4AF37" />
          <Text style={styles.actionButtonTextSecondary}>Join Event</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Events */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Events</Text>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No events yet</Text>
            <Text style={styles.emptyStateSubtext}>Create or join an event to get started!</Text>
          </View>
        ) : (
          events.slice(0, 3).map((event) => (
            <TouchableOpacity key={event.id} style={styles.eventCard} onPress={() => router.push(`/events/${event.id}`)}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(event.status) }]}>
                  <Text style={styles.statusText}>{event.status}</Text>
                </View>
              </View>
              <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              <View style={styles.eventFooter}>
                <View style={styles.participantInfo}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.participantCount}>{event.participant_count || 0} participants</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  welcomeText: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  userEmail: { fontSize: 16, color: '#6B7280' },
  statsContainer: { flexDirection: 'row', padding: 20, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  actionsContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  actionButton: { flex: 1, backgroundColor: '#D4AF37', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  actionButtonSecondary: { flex: 1, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#D4AF37', gap: 8 },
  actionButtonTextSecondary: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  sectionContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  eventCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  eventTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  eventDate: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  participantCount: { fontSize: 14, color: '#6B7280' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 },
});