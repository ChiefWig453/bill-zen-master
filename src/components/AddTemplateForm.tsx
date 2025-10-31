import { useState, useEffect } from 'react';
import { Plus, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BillTemplate } from '@/hooks/useBillTemplatesSecure';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(255, "Template name must be less than 255 characters"),
  amount: z.number().min(0, "Amount must be positive").max(999999.99, "Amount must be less than 1,000,000").optional(),
  category: z.string().trim().min(1, "Category is required").max(100, "Category must be less than 100 characters"),
  due_day: z.number().min(1, "Due day must be between 1-31").max(31, "Due day must be between 1-31").optional(),
});

interface AddTemplateFormProps {
  onAddTemplate: (template: Omit<BillTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<BillTemplate | null>;
  editingTemplate?: BillTemplate | null;
  onCancelEdit?: () => void;
  onCancelAdd?: () => void;
}

export const AddTemplateForm = ({ onAddTemplate, editingTemplate, onCancelEdit, onCancelAdd }: AddTemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    due_day: ''
  });
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const { allCategories, addCustomCategory } = useCategories();
  const { toast } = useToast();

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name || '',
        amount: editingTemplate.amount?.toString() || '',
        category: editingTemplate.category || '',
        due_day: editingTemplate.due_day?.toString() || ''
      });
    }
  }, [editingTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with Zod
    const validationResult = templateSchema.safeParse({
      name: formData.name.trim(),
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      category: formData.category.trim(),
      due_day: formData.due_day ? parseInt(formData.due_day) : undefined,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    const result = await onAddTemplate({
      name: validationResult.data.name,
      amount: validationResult.data.amount,
      category: validationResult.data.category,
      due_day: validationResult.data.due_day,
    });

    if (result && !editingTemplate) {
      setFormData({
        name: '',
        amount: '',
        category: '',
        due_day: ''
      });
    }
  };

  const handleAddCustomCategory = () => {
    const trimmedCategory = newCategory.trim();
    
    if (!trimmedCategory || trimmedCategory.length > 100) {
      toast({
        title: "Validation Error",
        description: "Category must be between 1 and 100 characters",
        variant: "destructive"
      });
      return;
    }

    const success = addCustomCategory(trimmedCategory);
    
    if (success) {
      setFormData(prev => ({ ...prev, category: trimmedCategory }));
      setNewCategory('');
      setShowAddCategory(false);
      toast({
        title: "Category added",
        description: `"${trimmedCategory}" has been added to your categories.`
      });
    } else {
      toast({
        title: "Category exists",
        description: "This category already exists.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    if (editingTemplate && onCancelEdit) {
      onCancelEdit();
    } else {
      if (onCancelAdd) {
        onCancelAdd();
      }
      setFormData({
        name: '',
        amount: '',
        category: '',
        due_day: ''
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {editingTemplate ? 'Edit Recurring Bill' : 'Add Recurring Bill'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bill Name</Label>
              <Input
                id="name"
                placeholder="e.g., Electric Bill"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                maxLength={255}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Optional)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max="999999.99"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_day">Due Day of Month (Optional)</Label>
              <Input
                id="due_day"
                type="number"
                min="1"
                max="31"
                placeholder="e.g., 15"
                value={formData.due_day}
                onChange={(e) => setFormData(prev => ({ ...prev, due_day: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Enter the day of the month (1-31)
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category">Category</Label>
                <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Custom Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newCategory">Category Name</Label>
                        <Input
                          id="newCategory"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Enter category name"
                          maxLength={100}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomCategory()}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddCustomCategory}>
                          Add Category
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editingTemplate ? 'Update Recurring Bill' : 'Add Recurring Bill'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};