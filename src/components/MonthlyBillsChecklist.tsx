import { useState } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { RecurringBill } from '@/hooks/useRecurringBills';
import { Bill } from '@/hooks/useBills';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MonthlyBillsChecklistProps {
  recurringBills: RecurringBill[];
  bills: Bill[];
  onBillUpdated?: () => void;
}

export const MonthlyBillsChecklist = ({ recurringBills, bills, onBillUpdated }: MonthlyBillsChecklistProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const currentMonth = format(currentDate, 'MMMM yyyy');

  // Check if a recurring bill has been paid this month
  const isRecurringBillPaid = (recurringBill: RecurringBill): boolean => {
    return bills.some(bill => {
      const billDate = parseISO(bill.due_date);
      const isSameMonth = billDate >= monthStart && billDate <= monthEnd;
      const matchesRecurringBill = 
        bill.name === recurringBill.name && 
        bill.category === recurringBill.category &&
        bill.is_paid;
      
      return isSameMonth && matchesRecurringBill;
    });
  };

  const handleCheckboxChange = async (recurringBill: RecurringBill, isChecked: boolean) => {
    if (!user) return;
    
    setProcessingIds(prev => new Set(prev).add(recurringBill.id));

    try {
      if (isChecked) {
        // Create a new paid bill for this recurring bill
        const dueDay = recurringBill.due_day || 1;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dueDate = new Date(year, month, Math.min(dueDay, new Date(year, month + 1, 0).getDate()));
        
        const result = await apiClient.createBill({
          name: recurringBill.name,
          amount: recurringBill.amount || 0,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          category: recurringBill.category,
          is_paid: true,
          is_archived: false,
        });

        if (result.error) throw new Error(result.error);

        toast({
          title: "Bill marked as paid",
          description: `${recurringBill.name} has been marked as paid for ${currentMonth}.`,
        });
      } else {
        // Find and delete the paid bill for this recurring bill in current month
        const billToDelete = bills.find(bill => {
          const billDate = parseISO(bill.due_date);
          const isSameMonth = billDate >= monthStart && billDate <= monthEnd;
          const matchesRecurringBill = 
            bill.name === recurringBill.name && 
            bill.category === recurringBill.category &&
            bill.is_paid;
          
          return isSameMonth && matchesRecurringBill;
        });

        if (billToDelete) {
          const result = await apiClient.deleteBill(billToDelete.id);

          if (result.error) throw new Error(result.error);

          toast({
            title: "Bill unmarked",
            description: `${recurringBill.name} has been unmarked for ${currentMonth}.`,
          });
        }
      }

      onBillUpdated?.();
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: "Error",
        description: "Failed to update bill status",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recurringBill.id);
        return newSet;
      });
    }
  };

  if (recurringBills.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">{currentMonth} Bills Checklist</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
          <div className="space-y-2 sm:space-y-3">
            {recurringBills.map((recurringBill) => {
              const isPaid = isRecurringBillPaid(recurringBill);
              const isProcessing = processingIds.has(recurringBill.id);

              return (
                <div
                  key={recurringBill.id}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`checklist-${recurringBill.id}`}
                    checked={isPaid}
                    onCheckedChange={(checked) => handleCheckboxChange(recurringBill, checked as boolean)}
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor={`checklist-${recurringBill.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium text-sm sm:text-base truncate ${isPaid ? 'line-through text-muted-foreground' : ''}`}>
                          {recurringBill.name}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {recurringBill.category}
                          {recurringBill.amount != null && !Number.isNaN(Number(recurringBill.amount)) && ` • $${Number(recurringBill.amount).toFixed(2)}`}
                          {recurringBill.due_day && ` • ${recurringBill.due_day}${getDaySuffix(recurringBill.due_day)}`}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
