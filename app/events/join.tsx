import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ArrowLeft, Users, Hash } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function JoinEventScreen() {
  const { user } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!accessCode.trim()) {
      Alert.alert('Error', 'Please enter an access code');
      return;
    }

    setLoading(true);

    try {
      // Find event by access code
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('access_code', accessCode.trim().toUpperCase())
        .single();

      if (eventError || !event) {
        Alert.alert('Error', 'Invalid access code. Please check and try again.');
        setLoading(false);
        return;
      }

      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user!.id)
        .single();

      if (existingParticipant) {
        Alert.alert(
          'Already Joined',
          'You are already a participant in this event!',
          [
            {
              text: 'View Event',
              onPress: () => router.replace(`/events/${event.id}`),
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Add user as participant
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert([
          {
            event_id: event.id,
            user_id: user!.id,
          },
        ]);

      if (participantError) throw participantError;

      Alert.alert(
        'Success!',
        `You've successfully joined "${event.title}"!`,
        [
          {
            text: 'View Event',
            onPress: () => router.replace(`/events/${event.id}`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error joining event:', error);
      Alert.alert('Error', error.message || 'Failed to join event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Event</Text>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Users size={48} color="#D4AF37" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Enter Access Code</Text>
        <Text style={styles.subtitle}>
          Get the access code from your event organizer to join the wedding betting fun!
        </Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Hash size={20} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder="Enter 6-character access code"
            value={accessCode}
            onChangeText={setAccessCode}
            autoCapitalize="characters"
            maxLength={6}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, loading && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          <Text style={styles.joinButtonText}>
            {loading ? 'Joining...' : 'Join Event'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How to get an access code:</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1.</Text>
            <Text style={styles.infoText}>
              Ask the wedding couple or event organizer
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2.</Text>
            <Text style={styles.infoText}>
              Check wedding invitations or announcements
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3.</Text>
            <Text style={styles.infoText}>
              Look for shared messages in wedding groups
            </Text>
          </View>
        </View>

        {/* Create Event Alternative */}
        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeText}>
            Don't have a code? You can also{' '}
            <TouchableOpacity onPress={() => router.replace('/events/create')}>
              <Text style={styles.alternativeLink}>create your own event</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    marginBottom: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },
  joinButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  joinButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  infoNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  alternativeContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  alternativeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  alternativeLink: {
    color: '#D4AF37',
    fontWeight: '600',
  },
});