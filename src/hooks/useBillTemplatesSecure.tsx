import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BillTemplate {
  id: string;
  name: string;
  amount?: number;
  category: string;
  due_day?: number;
  created_at: string;
  updated_at: string;
}

export const useBillTemplatesSecure = () => {
  const [templates, setTemplates] = useState<BillTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch templates from database
  const fetchTemplates = async () => {
    if (!user) {
      setTemplates([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bill_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to load templates",
          variant: "destructive",
        });
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load templates when user changes
  useEffect(() => {
    fetchTemplates();
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
        console.error('Error migrating templates:', error);
        return;
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('billTemplates');
      
      toast({
        title: "Templates migrated",
        description: `${localTemplates.length} templates have been migrated to secure storage.`,
      });

      // Refresh templates
      fetchTemplates();
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
      throw new Error('Template name must be between 1 and 255 characters');
    }
    
    if (amount !== undefined && (amount < 0 || amount > 999999.99)) {
      throw new Error('Amount must be between 0 and 999,999.99');
    }
    
    if (category && (category.trim().length === 0 || category.length > 100)) {
      throw new Error('Category must be between 1 and 100 characters');
    }
  };

  const addTemplate = async (templateData: Omit<BillTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add templates",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Validate input
      validateInput(templateData.name, templateData.amount, templateData.category);

      const { data, error } = await supabase
        .from('bill_templates')
        .insert([{
          user_id: user.id,
          name: templateData.name.trim(),
          amount: templateData.amount,
          category: templateData.category.trim(),
          due_day: templateData.due_day,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding template:', error);
        toast({
          title: "Error",
          description: "Failed to add template",
          variant: "destructive",
        });
        return null;
      }

      setTemplates(prev => [data, ...prev]);
      
      toast({
        title: "Template added",
        description: `${data.name} template has been created.`,
      });
      
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add template';
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<BillTemplate>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to update templates",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate input if being updated
      if (updates.name !== undefined || updates.amount !== undefined || updates.category !== undefined) {
        const currentTemplate = templates.find(t => t.id === id);
        validateInput(
          updates.name ?? currentTemplate?.name ?? '',
          updates.amount,
          updates.category ?? currentTemplate?.category
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
        console.error('Error updating template:', error);
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive",
        });
        return;
      }

      setTemplates(prev => prev.map(template => 
        template.id === id ? { ...template, ...cleanUpdates } : template
      ));
      
      toast({
        title: "Template updated",
        description: "Template has been successfully updated.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update template';
      toast({
        title: "Validation Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to delete templates",
        variant: "destructive",
      });
      return;
    }

    const templateToDelete = templates.find(template => template.id === id);
    
    try {
      const { error } = await supabase
        .from('bill_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        });
        return;
      }

      setTemplates(prev => prev.filter(template => template.id !== id));
      
      toast({
        title: "Template deleted",
        description: `${templateToDelete?.name} template has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  return {
    templates,
    isLoading,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplates
  };
};