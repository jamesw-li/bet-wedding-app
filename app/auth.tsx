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

          <View style={styles.inputContainer}>
            <Lock size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={(text) => { setPassword(text); setErrorMessage(null); }}
              secureTextEntry={!showPassword}
              autoComplete="password"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); setErrorMessage(null); }}
                secureTextEntry={!showPassword}
                autoComplete="password"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          )}

          {/* This error message will now ONLY appear on web */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsSignUp(!isSignUp);
              setPassword('');
              setConfirmPassword('');
              setErrorMessage(null);
            }}
          >
            <Text style={styles.toggleButton}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Features section remains the same */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>
            {isSignUp ? 'Join the fun!' : 'Welcome back!'}
          </Text>
          <View style={styles.feature}>
            <Text style={styles.featureText}>
              投 Create and manage wedding betting events
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureText}>
              識 Place bets on wedding predictions
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureText}>
              醇 Compete on global leaderboards
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureText}>
              腸 Win points and earn bragging rights
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Add the error styles
const styles = StyleSheet.create({
  // ... (all other styles remain the same)
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  toggleButton: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  feature: {
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
});