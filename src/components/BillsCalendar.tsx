import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bill } from '@/hooks/useBills';
import { Income } from '@/types/income';
import { BillTemplate } from '@/hooks/useBillTemplatesSecure';
import { format, isSameDay, isBefore, parseISO, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface BillsCalendarProps {
  bills: Bill[];
  incomes: Income[];
  templates: BillTemplate[];
  onEditBill?: (bill: Bill) => void;
  onEditIncome?: (income: Income) => void;
}

export const BillsCalendar = ({ bills, incomes, templates, onEditBill, onEditIncome }: BillsCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ bills: Bill[], incomes: Income[], templates: BillTemplate[] }>({ bills: [], incomes: [], templates: [] });

  const now = new Date();

  const getBillsForDate = (date: Date) => {
    return bills.filter(bill => isSameDay(parseISO(bill.due_date), date));
  };

  const getIncomesForDate = (date: Date) => {
    return incomes.filter(income => {
      const incomeDate = income.date_received ? parseISO(income.date_received) : null;
      return incomeDate && isSameDay(incomeDate, date);
    });
  };

  const getTemplatesForDate = (date: Date) => {
    const day = date.getDate();
    return templates.filter(template => {
      // Match templates that have this due_day
      if (!template.due_day) return false;
      
      // Check if this template already has a bill created for this date
      const hasExistingBill = bills.some(bill => 
        isSameDay(parseISO(bill.due_date), date) &&
        bill.name === template.name &&
        bill.category === template.category
      );
      
      // Only show template if no bill exists for this date
      return template.due_day === day && !hasExistingBill;
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateBills = getBillsForDate(date);
      const dateIncomes = getIncomesForDate(date);
      const dateTemplates = getTemplatesForDate(date);
      
      if (dateBills.length > 0 || dateIncomes.length > 0 || dateTemplates.length > 0) {
        setSelectedItems({ bills: dateBills, incomes: dateIncomes, templates: dateTemplates });
        setShowDetailsDialog(true);
      }
    }
  };

  const modifiers = {
    hasTemplates: (date: Date) => getTemplatesForDate(date).length > 0,
    hasIncome: (date: Date) => getIncomesForDate(date).length > 0,
  };

  const modifiersClassNames = {
    hasTemplates: 'bg-purple-100 text-purple-900 hover:bg-purple-200',
    hasIncome: 'bg-blue-100 text-blue-900 hover:bg-blue-200',
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className={cn("p-3 pointer-events-auto")}
            />
          </div>
          <div className="flex gap-4 mt-4 justify-center flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-sm">Recurring Bills</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-sm">Income</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              Bills and income scheduled for this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedItems.bills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Bills</h4>
                <div className="space-y-2">
                  {selectedItems.bills.map(bill => (
                    <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bill.name}</span>
                          {bill.is_paid ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>
                          ) : isBefore(parseISO(bill.due_date), now) ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="secondary">Unpaid</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${Number(bill.amount).toFixed(2)} • {bill.category}
                        </div>
                      </div>
                      {onEditBill && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onEditBill(bill);
                            setShowDetailsDialog(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItems.templates.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recurring Bills (Not Yet Created)</h4>
                <div className="space-y-2">
                  {selectedItems.templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg bg-purple-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">Template</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {template.amount ? `$${Number(template.amount).toFixed(2)} • ` : ''}{template.category}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Use the checklist to mark as paid for this month
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItems.incomes.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Income</h4>
                <div className="space-y-2">
                  {selectedItems.incomes.map(income => (
                    <div key={income.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{income.name}</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Income</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${Number(income.amount).toFixed(2)} • {income.category}
                        </div>
                      </div>
                      {onEditIncome && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onEditIncome(income);
                            setShowDetailsDialog(false);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
