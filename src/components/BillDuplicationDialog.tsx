import { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { Copy, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bill } from '@/types/bill';

interface BillDuplicationDialogProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
}

export const BillDuplicationDialog = ({ 
  bill, 
  isOpen, 
  onClose, 
  onDuplicate 
}: BillDuplicationDialogProps) => {
  const nextMonthDate = addMonths(new Date(bill.dueDate), 1);
  const [duplicatedBill, setDuplicatedBill] = useState({
    name: bill.name,
    amount: bill.amount,
    dueDate: format(nextMonthDate, 'yyyy-MM-dd'),
    category: bill.category
  });

  const handleDuplicate = () => {
    onDuplicate({
      ...duplicatedBill,
      amount: Number(duplicatedBill.amount),
      isPaid: false
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Copy className="h-5 w-5 text-primary" />
            <DialogTitle>Duplicate Bill for Next Month</DialogTitle>
          </div>
          <DialogDescription>
            Create a copy of "{bill.name}" for next month. You can modify the details below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bill Name</Label>
            <Input
              id="name"
              value={duplicatedBill.name}
              onChange={(e) => setDuplicatedBill(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={duplicatedBill.amount}
              onChange={(e) => setDuplicatedBill(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="dueDate"
                type="date"
                value={duplicatedBill.dueDate}
                onChange={(e) => setDuplicatedBill(prev => ({ ...prev, dueDate: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate}>
            Create Bill
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};