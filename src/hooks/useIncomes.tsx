import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
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
    
    setIsLoading(true);
    try {
      const result = await apiClient.getIncomes();
      
      if (result.error) throw new Error(result.error);
      setIncomes((result.data as Income[]) || []);
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
      const result = await apiClient.createIncome(incomeData);
      
      if (result.error) throw new Error(result.error);
      
      const newIncome = result.data as Income;
      setIncomes(prev => [...prev, newIncome]);
      toast({
        title: "Income added",
        description: "Your income has been successfully added.",
      });
      
      return newIncome;
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
      const result = await apiClient.updateIncome(id, updates);
      
      if (result.error) throw new Error(result.error);
      
      const updatedIncome = result.data as Income;
      setIncomes(prev => prev.map(income => income.id === id ? updatedIncome : income));
      return updatedIncome;
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
      const result = await apiClient.deleteIncome(id);
      
      if (result.error) throw new Error(result.error);
      
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
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchIncomes, 30000);
      return () => clearInterval(interval);
    }
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
