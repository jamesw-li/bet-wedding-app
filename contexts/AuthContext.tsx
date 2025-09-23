import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, useSegments } from 'expo-router';

// Define the shape of the context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // We remove signIn and signUp from here as they are only used in the auth screen
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hook to manage the auth state and navigation
function useAuthInitialState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // If loading is complete, handle routing
    if (!loading) {
      const inAuthGroup = segments[0] === 'auth';

      if (user && inAuthGroup) {
        // Redirect to the main app if the user is signed in and on the auth screen
        router.replace('/(tabs)');
      } else if (!user && !inAuthGroup) {
        // Redirect to the auth screen if the user is not signed in and not on the auth screen
        router.replace('/auth');
      }
    }
  }, [user, loading, segments, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // The useEffect above will handle the redirect automatically
  };
  
  // Note: We don't need to expose signIn and signUp here because they
  // are called directly from the auth screen and don't affect global state
  // in the same way. Keeping the context clean is good practice.

  return {
    user,
    session,
    loading,
    signOut,
  };
}

// The AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useAuthInitialState();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}