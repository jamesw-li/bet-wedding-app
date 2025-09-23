import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { ArrowLeft, Calendar, Type, FileText } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CreateEventScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateString, setDateString] = useState(''); // FIX: Default is now blank
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null); // State for inline error
  const [titleError, setTitleError] = useState<string | null>(null);

  const formatDateForSupabase = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    setDateError(null); // Clear previous errors

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title.');
      return;
    }

    let finalDate = '';

    if (Platform.OS === 'web') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        // FIX: Set the inline error message instead of using an alert
        setDateError('Invalid Date Format: Please use YYYY-MM-DD.');
        return;
      }
      finalDate = dateString;
    } else {
      finalDate = formatDateForSupabase(date);
    }

    setLoading(true);

    try {
      const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error: eventError } = await supabase
        .from('events')
        .insert([{
            title: title.trim(),
            description: description.trim() || null,
            date: finalDate,
            creator_id: user!.id,
            access_code: accessCode,
        }])
        .select()
        .single();

      if (eventError) throw eventError;
      
      const newEventId = data.id;
      await supabase.from('event_participants').insert([{ event_id: newEventId, user_id: user!.id }]);
      const defaultCategories = [
        { title: 'First Dance Song', description: "What will be the couple's first dance song?", options: ['A Love Song', 'Classic Rock', 'Pop Hit', 'Country Song', 'Other'], points: 10 },
        { title: 'Who Will Cry First?', description: 'Who will be the first to shed tears during the ceremony?', options: ['Bride', 'Groom', 'Mother of Bride', 'Mother of Groom', 'Someone Else'], points: 15 },
        { title: 'Bouquet Catch', description: 'Who will catch the bouquet?', options: ['Single Friend', 'Married Friend', 'Family Member', 'Child', 'No One'], points: 20 },
        { title: 'Speech Duration', description: "How long will the best man's speech be?", options: ['Under 2 minutes', '2-5 minutes', '5-10 minutes', 'Over 10 minutes'], points: 10 },
        { title: 'Wedding Crasher', description: 'Will there be any unexpected guests?', options: ['Yes', 'No'], points: 25 },
      ];
      const categoriesWithEventId = defaultCategories.map(cat => ({ ...cat, event_id: newEventId }));
      await supabase.from('bet_categories').insert(categoriesWithEventId);
      
      router.replace(`/events/${newEventId}`);

    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
      </View>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <View style={styles.inputContainer}>
            <Type size={20} color="#6B7280" />
            <TextInput style={styles.input} placeholder="e.g., Sarah & John's Wedding" value={title} onChangeText={setTitle} placeholderTextColor="#9CA3AF" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Wedding Date *</Text>
          {Platform.OS === 'web' ? (
            <>
              <View style={styles.inputContainer}>
                <Calendar size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={dateString}
                  onChangeText={(text) => {
                    setDateString(text);
                    setDateError(null); // Clear error when user types
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {/* FIX: Conditionally render the error message */}
              {dateError && <Text style={styles.errorText}>{dateError}</Text>}
            </>
          ) : (
            <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.dateText}>{date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showDatePicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <View style={[styles.inputContainer, styles.textareaContainer]}>
            <FileText size={20} color="#6B7280" style={styles.textareaIcon} />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Add any special details about the wedding or betting rules..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            • Your event will get a unique access code{'\n'}
            • Default betting categories will be created{'\n'}
            • You can customize bets and manage participants{'\n'}
            • Share the access code with your guests
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating Event...' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  textareaContainer: { alignItems: 'flex-start', paddingTop: 16 },
  textareaIcon: { marginTop: 2 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  dateText: { fontSize: 16, color: '#1F2937' },
  infoCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 32, borderWidth: 1, borderColor: '#DBEAFE' },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#1E40AF', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#1E40AF', lineHeight: 20 },
  createButton: { backgroundColor: '#D4AF37', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 40 },
  createButtonDisabled: { backgroundColor: '#D1D5DB' },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  // FIX: Add a style for the inline error text
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
});