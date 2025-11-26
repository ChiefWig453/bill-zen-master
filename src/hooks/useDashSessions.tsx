import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from './useAuth';
import { DashSession } from '@/types/dash';
import { useToast } from './use-toast';

export const useDashSessions = () => {
  const [sessions, setSessions] = useState<DashSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<DashSession[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await apiClient.getDashSessions();
      
      if (result.error) throw new Error(result.error);
      
      const data = (result.data as DashSession[]) || [];
      setSessions(data);
      setActiveSessions(data.filter(session => !session.end_time));
    } catch (error) {
      console.error('Error fetching dash sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load dash sessions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    if (!user) return;

    try {
      const result = await apiClient.createDashSession({
        start_time: new Date().toISOString(),
        total_earnings: 0,
        total_deliveries: 0,
        tips_cash: 0,
        tips_app: 0,
        base_pay: 0,
        promotions: 0
      });

      if (result.error) throw new Error(result.error);

      const newSession = result.data as DashSession;
      setSessions(prev => [newSession, ...prev]);
      setActiveSessions(prev => [...prev, newSession]);
      
      toast({
        title: "Session Started",
        description: "Your DoorDash session has begun!"
      });
      
      return newSession;
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive"
      });
    }
  };

  const createSession = async (sessionData: Omit<DashSession, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_hours'>) => {
    if (!user) return;

    try {
      const result = await apiClient.createDashSession(sessionData);

      if (result.error) throw new Error(result.error);

      const newSession = result.data as DashSession;
      setSessions(prev => [newSession, ...prev]);
      
      toast({
        title: "Session Added",
        description: "Your past session has been recorded!"
      });
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to add session",
        variant: "destructive"
      });
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const result = await apiClient.updateDashSession(sessionId, {
        end_time: new Date().toISOString()
      });

      if (result.error) throw new Error(result.error);

      const updatedSession = result.data as DashSession;
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session Ended",
        description: "Your DoorDash session has been completed!"
      });
      
      return updatedSession;
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive"
      });
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<DashSession>) => {
    try {
      const result = await apiClient.updateDashSession(sessionId, updates);

      if (result.error) throw new Error(result.error);

      const updatedSession = result.data as DashSession;
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      setActiveSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
      
      toast({
        title: "Session Updated",
        description: "Session details have been saved"
      });
      
      return updatedSession;
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session",
        variant: "destructive"
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const result = await apiClient.deleteDashSession(sessionId);

      if (result.error) throw new Error(result.error);

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session Deleted",
        description: "Session has been removed"
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return {
    sessions,
    activeSessions,
    isLoading,
    startSession,
    createSession,
    endSession,
    updateSession,
    deleteSession,
    refreshSessions: fetchSessions
  };
};
