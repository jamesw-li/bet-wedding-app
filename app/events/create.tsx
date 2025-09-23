import React, { useState, useEffect } from 'react';
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
  
  // State for the native date picker on mobile
  const [date, setDate] = useState(new Date()); 
  
  // State for the text input on web
  const [dateString, setDateString] = useState(''); 

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to format a Date object into a YYYY-MM-DD string
  const formatDateForSupabase = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set initial date string for web on component mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      setDateString(formatDateForSupabase(new Date()));
    }
  }, []);

  // Handler for the native date picker (mobile)
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title.');
      return;
    }

    let finalDate = '';

    // THE FIX: Use different validation and data sources for web vs. mobile
    if (Platform.OS === 'web') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        Alert.alert('Invalid Date Format', 'Please enter the date in YYYY-MM-DD format.');
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
            <View style={styles.inputContainer}>
              <Calendar size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={dateString}
                onChangeText={setDateString}
                placeholderTextColor="#9CA3AF"
              />
            </View>
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