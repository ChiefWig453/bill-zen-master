import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import type { UserPreferences } from '@/types/settings';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await apiClient.getPreferences();
      
      if (result.error) throw new Error(result.error);
      setPreferences(result.data as UserPreferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<Pick<UserPreferences, 'bills_enabled' | 'doordash_enabled'>>) => {
    if (!user) return;

    try {
      const result = await apiClient.updatePreferences(updates);
      
      if (result.error) throw new Error(result.error);

      await fetchPreferences();
      toast({
        title: "Success",
        description: "Preferences updated successfully",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchPreferences();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchPreferences, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    fetchPreferences,
  };
};
