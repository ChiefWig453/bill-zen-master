import { useState } from 'react';
import { Plus, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bill } from '@/types/bill';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { addBillSchema, categorySchema } from '@/lib/validation';

interface AddBillFormProps {
  onAddBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  editingBill?: Bill | null;
  onCancelEdit?: () => void;
  onCancelAdd?: () => void;
}

export const AddBillForm = ({ onAddBill, editingBill, onCancelEdit, onCancelAdd }: AddBillFormProps) => {
  const [formData, setFormData] = useState({
    name: editingBill?.name || '',
    amount: editingBill?.amount?.toString() || '',
    dueDate: editingBill?.dueDate || '',
    category: editingBill?.category || '',
    isPaid: editingBill?.isPaid || false
  });
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const { allCategories, addCustomCategory } = useCategories();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with Zod
    const validationResult = addBillSchema.safeParse({
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      category: formData.category.trim(),
      isPaid: formData.isPaid
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

    onAddBill({
      name: formData.name,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      category: formData.category,
      isPaid: formData.isPaid
    });

    if (!editingBill) {
      setFormData({
        name: '',
        amount: '',
        dueDate: '',
        category: '',
        isPaid: false
      });
    }
  };

  const handleAddCustomCategory = () => {
    // Validate category with Zod
    const validationResult = categorySchema.safeParse(newCategory);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }

    const trimmedCategory = validationResult.data;
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
    if (editingBill && onCancelEdit) {
      onCancelEdit();
    } else {
      // When adding a new bill, close the form
      if (onCancelAdd) {
        onCancelAdd();
      }
      // Also clear the form data
      setFormData({
        name: '',
        amount: '',
        dueDate: '',
        category: '',
        isPaid: false
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {editingBill ? 'Edit Bill' : 'Add New Bill'}
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
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
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
              {editingBill ? 'Update Bill' : 'Add Bill'}
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