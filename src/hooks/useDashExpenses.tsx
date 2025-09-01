import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DashExpense } from '@/types/dash';
import { useToast } from './use-toast';

export const useDashExpenses = () => {
  const [expenses, setExpenses] = useState<DashExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('dash_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching dash expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createExpense = async (expense: Omit<DashExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('dash_expenses')
        .insert({
          ...expense,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => [data, ...prev]);
      
      toast({
        title: "Expense Added",
        description: "Your expense has been recorded"
      });

      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive"
      });
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<DashExpense>) => {
    try {
      const { data, error } = await supabase
        .from('dash_expenses')
        .update(updates)
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => prev.map(e => e.id === expenseId ? data : e));
      
      toast({
        title: "Expense Updated",
        description: "Expense details have been saved"
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive"
      });
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('dash_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      
      toast({
        title: "Expense Deleted",
        description: "Expense has been removed"
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  return {
    expenses,
    isLoading,
    createExpense,
    updateExpense,
    deleteExpense,
    refreshExpenses: fetchExpenses
  };
};