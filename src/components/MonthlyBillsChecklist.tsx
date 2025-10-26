import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BillTemplate } from '@/hooks/useBillTemplatesSecure';
import { Bill } from '@/hooks/useBills';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MonthlyBillsChecklistProps {
  templates: BillTemplate[];
  bills: Bill[];
  onBillUpdated?: () => void;
}

export const MonthlyBillsChecklist = ({ templates, bills, onBillUpdated }: MonthlyBillsChecklistProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const currentMonth = format(currentDate, 'MMMM yyyy');

  // Check if a template has been paid this month
  const isTemplatePaid = (template: BillTemplate): boolean => {
    return bills.some(bill => {
      const billDate = parseISO(bill.due_date);
      const isSameMonth = billDate >= monthStart && billDate <= monthEnd;
      const matchesTemplate = 
        bill.name === template.name && 
        bill.category === template.category &&
        bill.is_paid;
      
      return isSameMonth && matchesTemplate;
    });
  };

  const handleCheckboxChange = async (template: BillTemplate, isChecked: boolean) => {
    if (!user) return;
    
    setProcessingIds(prev => new Set(prev).add(template.id));

    try {
      if (isChecked) {
        // Create a new paid bill for this template
        const dueDay = template.due_day || 1;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dueDate = new Date(year, month, Math.min(dueDay, new Date(year, month + 1, 0).getDate()));
        
        const { error } = await supabase
          .from('bills')
          .insert({
            user_id: user.id,
            name: template.name,
            amount: template.amount || 0,
            due_date: format(dueDate, 'yyyy-MM-dd'),
            category: template.category,
            is_paid: true,
            is_archived: false,
          });

        if (error) throw error;

        toast({
          title: "Bill marked as paid",
          description: `${template.name} has been marked as paid for ${currentMonth}.`,
        });
      } else {
        // Find and delete the paid bill for this template in current month
        const billToDelete = bills.find(bill => {
          const billDate = parseISO(bill.due_date);
          const isSameMonth = billDate >= monthStart && billDate <= monthEnd;
          const matchesTemplate = 
            bill.name === template.name && 
            bill.category === template.category &&
            bill.is_paid;
          
          return isSameMonth && matchesTemplate;
        });

        if (billToDelete) {
          const { error } = await supabase
            .from('bills')
            .delete()
            .eq('id', billToDelete.id);

          if (error) throw error;

          toast({
            title: "Bill unmarked",
            description: `${template.name} has been unmarked for ${currentMonth}.`,
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
        newSet.delete(template.id);
        return newSet;
      });
    }
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentMonth} Bills Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {templates.map((template) => {
              const isPaid = isTemplatePaid(template);
              const isProcessing = processingIds.has(template.id);

              return (
                <div
                  key={template.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`checklist-${template.id}`}
                    checked={isPaid}
                    onCheckedChange={(checked) => handleCheckboxChange(template, checked as boolean)}
                    disabled={isProcessing}
                  />
                  <label
                    htmlFor={`checklist-${template.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isPaid ? 'line-through text-muted-foreground' : ''}`}>
                          {template.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {template.category}
                          {template.amount && ` • $${template.amount.toFixed(2)}`}
                          {template.due_day && ` • Due: ${template.due_day}${getDaySuffix(template.due_day)}`}
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
