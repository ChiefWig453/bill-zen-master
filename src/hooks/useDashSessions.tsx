import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    
    try {
      const { data, error } = await supabase
        .from('dash_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      setSessions(data || []);
      setActiveSessions((data || []).filter(session => !session.end_time));
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
      const { data, error } = await supabase
        .from('dash_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          total_earnings: 0,
          total_deliveries: 0,
          tips_cash: 0,
          tips_app: 0,
          base_pay: 0,
          promotions: 0
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      setActiveSessions(prev => [...prev, data]);
      
      toast({
        title: "Session Started",
        description: "Your DoorDash session has begun!"
      });
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
      const { data, error } = await supabase
        .from('dash_sessions')
        .insert({
          ...sessionData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [data, ...prev]);
      
      toast({
        title: "Session Added",
        description: "Your past session has been recorded!"
      });
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
      const { data, error } = await supabase
        .from('dash_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => prev.map(s => s.id === sessionId ? data : s));
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      
      toast({
        title: "Session Ended",
        description: "Your DoorDash session has been completed!"
      });
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
      const { data, error } = await supabase
        .from('dash_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => prev.map(s => s.id === sessionId ? data : s));
      setActiveSessions(prev => prev.map(s => s.id === sessionId ? data : s));
      
      toast({
        title: "Session Updated",
        description: "Session details have been saved"
      });
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
      const { error } = await supabase
        .from('dash_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

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
    fetchSessions();
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