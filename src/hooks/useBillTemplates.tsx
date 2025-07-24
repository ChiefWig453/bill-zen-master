import { useState, useEffect } from 'react';
import { BillTemplate } from '@/types/billTemplate';
import { useToast } from '@/hooks/use-toast';

export const useBillTemplates = () => {
  const [templates, setTemplates] = useState<BillTemplate[]>([]);
  const { toast } = useToast();

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('billTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem('billTemplates', JSON.stringify(templates));
  }, [templates]);

  const addTemplate = (templateData: Omit<BillTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    const newTemplate: BillTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    
    toast({
      title: "Template added",
      description: `${newTemplate.name} template has been created.`,
    });
    
    return newTemplate;
  };

  const updateTemplate = (id: string, updates: Partial<BillTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...updates } : template
    ));
    
    toast({
      title: "Template updated",
      description: "Template has been successfully updated.",
    });
  };

  const deleteTemplate = (id: string) => {
    const templateToDelete = templates.find(template => template.id === id);
    setTemplates(prev => prev.filter(template => template.id !== id));
    
    toast({
      title: "Template deleted",
      description: `${templateToDelete?.name} template has been deleted.`,
    });
  };

  return {
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate
  };
};