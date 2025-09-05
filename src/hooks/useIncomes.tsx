import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Income } from '@/types/income';

export const useIncomes = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchIncomes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('next_date', { ascending: true, nullsFirst: false })
        .order('date_received', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setIncomes((data as Income[]) || []);
    } catch (error: any) {
      console.error('Error fetching incomes:', error);
      toast({
        title: "Error",
        description: "Failed to load incomes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addIncome = async (incomeData: Omit<Income, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert([{ ...incomeData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setIncomes(prev => [...prev, data as Income]);
      toast({
        title: "Income added",
        description: "Your income has been successfully added.",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding income:', error);
      toast({
        title: "Error",
        description: "Failed to add income. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      setIncomes(prev => prev.map(income => income.id === id ? { ...income, ...(data as Income) } : income));
      return data;
    } catch (error: any) {
      console.error('Error updating income:', error);
      toast({
        title: "Error",
        description: "Failed to update income. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteIncome = async (id: string) => {
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setIncomes(prev => prev.filter(income => income.id !== id));
      toast({
        title: "Income deleted",
        description: "Your income has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting income:', error);
      toast({
        title: "Error",
        description: "Failed to delete income. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markIncomeReceived = async (id: string) => {
    const income = incomes.find(i => i.id === id);
    if (!income) return;

    try {
      await updateIncome(id, { 
        is_received: !income.is_received,
        date_received: !income.is_received ? new Date().toISOString().split('T')[0] : income.date_received
      });
    } catch (error) {
      // Error is handled in updateIncome
    }
  };

  useEffect(() => {
    if (user) {
      fetchIncomes();
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('incomes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incomes',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchIncomes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    incomes,
    isLoading,
    fetchIncomes,
    addIncome,
    updateIncome,
    deleteIncome,
    markIncomeReceived,
  };
};