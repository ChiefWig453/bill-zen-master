import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserPreferences } from '@/types/settings';
import { apiClient } from '@/lib/apiClient';

interface AuthContextType {
  user: { id: string; email: string } | null;
  session: { userId: string } | null;
  profile: any | null;
  userRole: 'admin' | 'user' | null;
  userPreferences: UserPreferences | null;
  updateUserPreferences: (updates: Partial<Pick<UserPreferences, 'bills_enabled' | 'doordash_enabled' | 'home_maintenance_enabled'>>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [session, setSession] = useState<{ userId: string } | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on mount
    const userId = apiClient.getUserId();
    
    if (userId && apiClient.isAuthenticated()) {
      const userEmail = localStorage.getItem('userEmail') || '';
      setUser({ id: userId, email: userEmail });
      setSession({ userId });
      
      // Fetch user data
      setTimeout(() => {
        fetchUserProfile(userId);
        fetchUserRole(userId);
        fetchUserPreferences(userId);
      }, 0);
    }
    
    setIsLoading(false);
  }, []);

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    };

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Start the initial timer
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, [user]);

  // Set up real-time subscription for preferences changes
  useEffect(() => {
    if (!user) return;

    const prefsChannel = supabase
      .channel('auth-user-preferences-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUserPreferences(user.id);
        }
      )
      .subscribe();

    const profileChannel = supabase
      .channel('auth-user-profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchUserProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(prefsChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // Don't log sensitive error details to console in production
        return;
      }
      
      setProfile(data);
    } catch (error) {
      // Don't log sensitive error details to console in production
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        return;
      }
      
      setUserRole(data?.role || null);
    } catch (error) {
      // Don't log sensitive error details to console in production
    }
  };

  const fetchUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        return;
      }
      
      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            bills_enabled: true,
            doordash_enabled: false,
          })
          .select()
          .single();

        if (insertError) {
          return;
        }
        setUserPreferences(newPrefs);
      } else {
        setUserPreferences(data);
      }
    } catch (error) {
      // Don't log sensitive error details to console in production
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    await fetchUserProfile(user.id);
  };

  const updateUserPreferences = async (updates: Partial<Pick<UserPreferences, 'bills_enabled' | 'doordash_enabled' | 'home_maintenance_enabled'>>): Promise<void> => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) return;
      setUserPreferences(data);
    } catch (e) {
      // swallow
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiClient.login(email, password);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        const userData = { id: result.data.user.id, email: result.data.user.email };
        setUser(userData);
        setSession({ userId: result.data.user.id });
        localStorage.setItem('userEmail', result.data.user.email);
        
        // Fetch additional user data
        setTimeout(() => {
          fetchUserProfile(result.data.user.id);
          fetchUserRole(result.data.user.id);
          fetchUserPreferences(result.data.user.id);
        }, 0);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, firstName?: string, lastName?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiClient.signup(email, password, firstName, lastName);

      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async (): Promise<void> => {
    await apiClient.logout();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
    setUserPreferences(null);
    localStorage.removeItem('userEmail');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, userRole, userPreferences, updateUserPreferences, refreshProfile, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};