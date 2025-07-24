import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BILL_CATEGORIES, Bill } from '@/types/bill';

interface AddBillFormProps {
  onAddBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  editingBill?: Bill | null;
  onCancelEdit?: () => void;
}

export const AddBillForm = ({ onAddBill, editingBill, onCancelEdit }: AddBillFormProps) => {
  const [formData, setFormData] = useState({
    name: editingBill?.name || '',
    amount: editingBill?.amount?.toString() || '',
    dueDate: editingBill?.dueDate || '',
    category: editingBill?.category || '',
    isPaid: editingBill?.isPaid || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.dueDate || !formData.category) {
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

  const handleCancel = () => {
    if (editingBill && onCancelEdit) {
      onCancelEdit();
    } else {
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
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BILL_CATEGORIES.map((category) => (
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
            {(editingBill || formData.name || formData.amount || formData.dueDate || formData.category) && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};