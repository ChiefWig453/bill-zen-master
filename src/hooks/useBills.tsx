import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  is_paid: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBills = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to load bills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addBill = async (billData: Omit<Bill, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bills')
        .insert([{ ...billData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setBills(prev => [...prev, data]);
      toast({
        title: "Bill added",
        description: "Your bill has been successfully added.",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding bill:', error);
      toast({
        title: "Error",
        description: "Failed to add bill. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      setBills(prev => prev.map(bill => bill.id === id ? { ...bill, ...data } : bill));
      return data;
    } catch (error: any) {
      console.error('Error updating bill:', error);
      toast({
        title: "Error",
        description: "Failed to update bill. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBill = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setBills(prev => prev.filter(bill => bill.id !== id));
      toast({
        title: "Bill deleted",
        description: "Your bill has been successfully deleted.",
      });
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Error",
        description: "Failed to delete bill. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const duplicateBill = async (id: string) => {
    const billToDuplicate = bills.find(bill => bill.id === id);
    if (!billToDuplicate) return;

    const { id: _, created_at, updated_at, user_id, ...billData } = billToDuplicate;
    return addBill({
      ...billData,
      name: `${billData.name} (Copy)`,
    });
  };

  // Migrate existing localStorage data to database
  const migrateFromLocalStorage = async () => {
    if (!user) return;

    try {
      const existingBills = localStorage.getItem('bills');
      if (existingBills) {
        const parsedBills = JSON.parse(existingBills);
        
        for (const bill of parsedBills) {
          await addBill({
            name: bill.name,
            amount: bill.amount,
            due_date: bill.dueDate,
            category: bill.category,
            is_paid: bill.isPaid || false,
            is_archived: bill.isArchived || false,
          });
        }
        
        // Clear localStorage after successful migration
        localStorage.removeItem('bills');
        toast({
          title: "Data migrated",
          description: "Your bills have been migrated to the secure database.",
        });
      }
    } catch (error) {
      console.error('Error migrating bills:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBills();
      migrateFromLocalStorage();
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('bills-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBills();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    bills,
    isLoading,
    fetchBills,
    addBill,
    updateBill,
    deleteBill,
    duplicateBill,
  };
};