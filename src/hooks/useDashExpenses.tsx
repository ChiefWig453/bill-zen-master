import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
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
    
    setIsLoading(true);
    try {
      const result = await apiClient.getDashExpenses();
      
      if (result.error) throw new Error(result.error);
      
      setExpenses((result.data as DashExpense[]) || []);
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
      const result = await apiClient.createDashExpense(expense);

      if (result.error) throw new Error(result.error);

      const newExpense = result.data as DashExpense;
      setExpenses(prev => [newExpense, ...prev]);
      
      toast({
        title: "Expense Added",
        description: "Your expense has been recorded"
      });

      return newExpense;
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
      const result = await apiClient.updateDashExpense(expenseId, updates);

      if (result.error) throw new Error(result.error);

      const updatedExpense = result.data as DashExpense;
      setExpenses(prev => prev.map(e => e.id === expenseId ? updatedExpense : e));
      
      toast({
        title: "Expense Updated",
        description: "Expense details have been saved"
      });
      
      return updatedExpense;
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
      const result = await apiClient.deleteDashExpense(expenseId);

      if (result.error) throw new Error(result.error);

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
    if (user) {
      fetchExpenses();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchExpenses, 30000);
      return () => clearInterval(interval);
    }
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
