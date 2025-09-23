import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform, // Import the Platform API
} from 'react-native';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const signIn = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email: string, password: string) => supabase.auth.signUp({ email, password });

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function to show errors based on the platform
  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      setErrorMessage(message);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      showError('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showError('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = isSignUp 
        ? await signUp(email.trim(), password)
        : await signIn(email.trim(), password);

      if (error) {
        // Use the new helper function to display the error
        showError('Error', error.message);
      } else {
        if (isSignUp) {
          Alert.alert(
            'Success', 
            'Account created successfully! You can now sign in.'
          );
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      showError('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Heart size={32} color="#D4AF37" />
          </View>
          <Text style={styles.title}>Wedding Betting</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrorMessage(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View