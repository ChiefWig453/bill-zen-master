import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RecurringBill {
  id: string;
  name: string;
  amount?: number;
  category: string;
  due_day?: number;
  created_at: string;
  updated_at: string;
}

export const useRecurringBills = () => {
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch recurring bills from database
  const fetchRecurringBills = async () => {
    if (!user) {
      setRecurringBills([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bill_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recurring bills:', error);
        toast({
          title: "Error",
          description: "Failed to load recurring bills",
          variant: "destructive",
        });
        return;
      }

      setRecurringBills(data || []);
    } catch (error) {
      console.error('Error fetching recurring bills:', error);
      toast({
        title: "Error",
        description: "Failed to load recurring bills",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load recurring bills when user changes
  useEffect(() => {
    fetchRecurringBills();
  }, [user]);

  // Migrate existing localStorage templates to database (one-time migration)
  const migrateFromLocalStorage = async () => {
    if (!user) return;

    const savedTemplates = localStorage.getItem('billTemplates');
    if (!savedTemplates) return;

    try {
      const localTemplates = JSON.parse(savedTemplates);
      if (localTemplates.length === 0) return;

      // Insert templates into database
      const templatesToInsert = localTemplates.map((template: any) => ({
        user_id: user.id,
        name: template.name,
        amount: template.amount,
        category: template.category,
        due_day: template.due_day,
      }));

      const { error } = await supabase
        .from('bill_templates')
        .insert(templatesToInsert);

      if (error) {
        console.error('Error migrating recurring bills:', error);
        return;
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('billTemplates');
      
      toast({
        title: "Recurring bills migrated",
        description: `${localTemplates.length} recurring bills have been migrated to secure storage.`,
      });

      // Refresh recurring bills
      fetchRecurringBills();
    } catch (error) {
      console.error('Error during migration:', error);
    }
  };

  // Perform migration on first load
  useEffect(() => {
    if (user && !isLoading) {
      migrateFromLocalStorage();
    }
  }, [user, isLoading]);

  const validateInput = (name: string, amount?: number, category?: string) => {
    if (!name || name.trim().length === 0 || name.length > 255) {
      throw new Error('Recurring bill name must be between 1 and 255 characters');
    }
    
    if (amount !== undefined && (amount < 0 || amount > 999999.99)) {
      throw new Error('Amount must be between 0 and 999,999.99');
    }
    
    if (category && (category.trim().length === 0 || category.length > 100)) {
      throw new Error('Category must be between 1 and 100 characters');
    }
  };

  const addRecurringBill = async (recurringBillData: Omit<RecurringBill, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add recurring bills",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Validate input
      validateInput(recurringBillData.name, recurringBillData.amount, recurringBillData.category);

      const { data, error } = await supabase
        .from('bill_templates')
        .insert([{
          user_id: user.id,
          name: recurringBillData.name.trim(),
          amount: recurringBillData.amount,
          category: recurringBillData.category.trim(),
          due_day: recurringBillData.due_day,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding recurring bill:', error);
        toast({
          title: "Error",
          description: "Failed to add recurring bill",
          variant: "destructive",
        });
        return null;
      }

      setRecurringBills(prev => [data, ...prev]);
      
      toast({
        title: "Recurring bill added",
        description: `${data.name} has been created.`,
      });
      
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add recurring bill';
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRecurringBill = async (id: string, updates: Partial<RecurringBill>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to update recurring bills",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate input if being updated
      if (updates.name !== undefined || updates.amount !== undefined || updates.category !== undefined) {
        const currentRecurringBill = recurringBills.find(t => t.id === id);
        validateInput(
          updates.name ?? currentRecurringBill?.name ?? '',
          updates.amount,
          updates.category ?? currentRecurringBill?.category
        );
      }

      const cleanUpdates = {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.category && { category: updates.category.trim() }),
        ...(updates.due_day !== undefined && { due_day: updates.due_day }),
      };

      const { error } = await supabase
        .from('bill_templates')
        .update(cleanUpdates)
        .eq('id', id);

      if (error) {
        console.error('Error updating recurring bill:', error);
        toast({
          title: "Error",
          description: "Failed to update recurring bill",
          variant: "destructive",
        });
        return;
      }

      setRecurringBills(prev => prev.map(recurringBill => 
        recurringBill.id === id ? { ...recurringBill, ...cleanUpdates } : recurringBill
      ));
      
      toast({
        title: "Recurring bill updated",
        description: "Recurring bill has been successfully updated.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update recurring bill';
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const deleteRecurringBill = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete recurring bills",
        variant: "destructive",
      });
      return;
    }

    const recurringBillToDelete = recurringBills.find(recurringBill => recurringBill.id === id);
    
    try {
      const { error } = await supabase
        .from('bill_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting recurring bill:', error);
        toast({
          title: "Error",
          description: "Failed to delete recurring bill",
          variant: "destructive",
        });
        return;
      }

      setRecurringBills(prev => prev.filter(recurringBill => recurringBill.id !== id));
      
      toast({
        title: "Recurring bill deleted",
        description: `${recurringBillToDelete?.name} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recurring bill",
        variant: "destructive",
      });
    }
  };

  return {
    recurringBills,
    isLoading,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    fetchRecurringBills
  };
};
