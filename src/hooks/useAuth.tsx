import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
      const userRoleStored = localStorage.getItem('userRole') as 'admin' | 'user' | null;
      
      setUser({ id: userId, email: userEmail });
      setSession({ userId });
      setUserRole(userRoleStored);
      
      // Fetch user data
      setTimeout(() => {
        fetchUserProfile(userId);
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

  // Poll for preferences and profile changes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUserProfile(user.id);
      fetchUserPreferences(user.id);
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const result = await apiClient.getProfile();
      
      if (result.error) {
        return;
      }
      
      setProfile(result.data);
    } catch (error) {
      // Don't log sensitive error details to console in production
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const result = await apiClient.getUserRole();
      
      if (result.error) {
        return;
      }
      
      setUserRole((result.data as any)?.role || null);
    } catch (error) {
      // Don't log sensitive error details to console in production
    }
  };

  const fetchUserPreferences = async (userId: string) => {
    try {
      const result = await apiClient.getPreferences();
      
      if (result.error) {
        return;
      }
      
      setUserPreferences(result.data as UserPreferences);
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
      const result = await apiClient.updatePreferences(updates);
      if (result.error) return;
      setUserPreferences(result.data as UserPreferences);
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
        setUserRole(result.data.user.role); // Store role from API response
        
        localStorage.setItem('userEmail', result.data.user.email);
        localStorage.setItem('userRole', result.data.user.role); // Persist role
        
        // Fetch additional user data
        setTimeout(() => {
          fetchUserProfile(result.data.user.id);
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
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, userRole, userPreferences, updateUserPreferences, refreshProfile, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};