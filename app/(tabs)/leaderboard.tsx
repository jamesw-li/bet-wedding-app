import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert, // Import Alert
} from 'react-native';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { Platform } from 'react-native';
import { RefreshCw } from 'lucide-react-native';

type EventParticipant = Database['public']['Tables']['event_participants']['Row'] & {
  user?: { email: string };
  events?: { title: string };
};

type LeaderboardEntry = {
  user_id: string;
  email: string;
  total_points: number;
  events_participated: number;
  rank: number;
};

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState({
    rank: 0,
    total_points: 0,
    events_participated: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // THE FIX: Call the new, secure database function to get the leaderboard data.
      const { data, error } = await supabase.rpc('get_leaderboard_data');
  
      if (error) throw error;
      
      // The data comes back pre-sorted and aggregated from the database.
      const leaderboardEntries = data.map((entry: any, index: number) => ({
        ...entry,
        rank: index + 1,
      }));
      
      setGlobalLeaderboard(leaderboardEntries);
  
      const currentUserStats = leaderboardEntries.find((entry: any) => entry.user_id === user.id);
      if (currentUserStats) {
        setUserStats({
          rank: currentUserStats.rank,
          total_points: currentUserStats.total_points,
          events_participated: currentUserStats.events_participated,
        });
      }
  
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
      Alert.alert('Error', error.message || 'Failed to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [user]);

  const onRefresh = async () => {
    setLoading(true);
    await loadLeaderboard();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={24} color="#FFD700" />;
      case 2:
        return <Medal size={24} color="#C0C0C0" />;
      case 3:
        return <Award size={24} color="#CD7F32" />;
      default:
        return (
          <View style={styles.rankNumber}>
            <Text style={styles.rankNumberText}>{rank}</Text>
          </View>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return '#6B7280';
    }
  };

  const formatEmail = (email: string) => {
    const [name] = email.split('@');
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#D4AF37']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <TrendingUp size={28} color="#D4AF37" />
      </View>

      {/* User Stats Card */}
      <View style={styles.userStatsCard}>
        <Text style={styles.userStatsTitle}>Your Stats</Text>
        <View style={styles.userStatsGrid}>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatNumber}>#{userStats.rank || '—'}</Text>
            <Text style={styles.userStatLabel}>Global Rank</Text>
          </View>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatNumber}>{userStats.total_points}</Text>
            <Text style={styles.userStatLabel}>Total Points</Text>
          </View>
          <View style={styles.userStatItem}>
            <Text style={styles.userStatNumber}>{userStats.events_participated}</Text>
            <Text style={styles.userStatLabel}>Events</Text>
          </View>
        </View>
      </View>

      {/* Leaderboard */}
      <View style={styles.leaderboardContainer}>
        <Text style={styles.sectionTitle}>Global Rankings</Text>
        
        {globalLeaderboard.length === 0 ? (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No rankings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start participating in events to see the leaderboard!
            </Text>
          </View>
        ) : (
          globalLeaderboard.map((entry, index) => (
            <View
              key={entry.user_id}
              style={[
                styles.leaderboardItem,
                entry.user_id === user?.id && styles.currentUserItem,
                index === 0 && styles.firstPlace,
                index === 1 && styles.secondPlace,
                index === 2 && styles.thirdPlace,
              ]}
            >
              <View style={styles.rankContainer}>
                {getRankIcon(entry.rank)}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={[
                  styles.userName,
                  entry.user_id === user?.id && styles.currentUserName
                ]}>
                  {formatEmail(entry.email)}
                  {entry.user_id === user?.id && ' (You)'}
                </Text>
                <Text style={styles.userEvents}>
                  {entry.events_participated} event{entry.events_participated !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={styles.pointsContainer}>
                <Text style={[
                  styles.points,
                  { color: getRankColor(entry.rank) }
                ]}>
                  {entry.total_points}
                </Text>
                <Text style={styles.pointsLabel}>points</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Achievement Categories */}
      <View style={styles.achievementContainer}>
        <Text style={styles.sectionTitle}>Top Performers</Text>
        
        {globalLeaderboard.length >= 1 && (
          <View style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Trophy size={20} color="#FFD700" />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Betting Champion</Text>
              <Text style={styles.achievementUser}>
                {formatEmail(globalLeaderboard[0].email)}
              </Text>
            </View>
            <Text style={styles.achievementPoints}>
              {globalLeaderboard[0].total_points} pts
            </Text>
          </View>
        )}
        
        {globalLeaderboard.length >= 2 && (
          <View style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: '#F5F5F5' }]}>
              <Medal size={20} color="#C0C0C0" />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Runner-up</Text>
              <Text style={styles.achievementUser}>
                {formatEmail(globalLeaderboard[1].email)}
              </Text>
            </View>
            <Text style={styles.achievementPoints}>
              {globalLeaderboard[1].total_points} pts
            </Text>
          </View>
        )}
        
        {globalLeaderboard.length >= 3 && (
          <View style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: '#FFF8E7' }]}>
              <Award size={20} color="#CD7F32" />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Third Place</Text>
              <Text style={styles.achievementUser}>
                {formatEmail(globalLeaderboard[2].email)}
              </Text>
            </View>
            <Text style={styles.achievementPoints}>
              {globalLeaderboard[2].total_points} pts
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Styles remain the same
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
  userStatsCard: {
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
  userStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  userStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  userStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 4,
  },
  userStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  leaderboardContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  leaderboardItem: {
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
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: '#FFFDF0',
  },
  firstPlace: {
    backgroundColor: '#FFFEF0',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  secondPlace: {
    backgroundColor: '#F9F9F9',
    borderLeftWidth: 4,
    borderLeftColor: '#C0C0C0',
  },
  thirdPlace: {
    backgroundColor: '#FFF8E7',
    borderLeftWidth: 4,
    borderLeftColor: '#CD7F32',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  currentUserName: {
    color: '#D4AF37',
  },
  userEvents: {
    fontSize: 12,
    color: '#6B7280',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  pointsLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  achievementContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  achievementCard: {
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
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  achievementUser: {
    fontSize: 14,
    color: '#6B7280',
  },
  achievementPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
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
  },
});