import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bill } from '@/hooks/useBills';
import { Income } from '@/types/income';
import { RecurringBill } from '@/hooks/useRecurringBills';
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
  recurringBills: RecurringBill[];
  onEditBill?: (bill: Bill) => void;
  onEditIncome?: (income: Income) => void;
}

export const BillsCalendar = ({ bills, incomes, recurringBills, onEditBill, onEditIncome }: BillsCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ bills: Bill[], incomes: Income[], recurringBills: RecurringBill[] }>({ bills: [], incomes: [], recurringBills: [] });

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

  const getRecurringBillsForDate = (date: Date) => {
    const day = date.getDate();
    return recurringBills.filter(recurringBill => {
      // Match recurring bills that have this due_day
      if (!recurringBill.due_day) return false;
      
      // Check if this recurring bill already has a bill created for this date
      const hasExistingBill = bills.some(bill => 
        isSameDay(parseISO(bill.due_date), date) &&
        bill.name === recurringBill.name &&
        bill.category === recurringBill.category
      );
      
      // Only show recurring bill if no bill exists for this date
      return recurringBill.due_day === day && !hasExistingBill;
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateBills = getBillsForDate(date);
      const dateIncomes = getIncomesForDate(date);
      const dateRecurringBills = getRecurringBillsForDate(date);
      
      if (dateBills.length > 0 || dateIncomes.length > 0 || dateRecurringBills.length > 0) {
        setSelectedItems({ bills: dateBills, incomes: dateIncomes, recurringBills: dateRecurringBills });
        setShowDetailsDialog(true);
      }
    }
  };

  const modifiers = {
    hasRecurringBills: (date: Date) => getRecurringBillsForDate(date).length > 0,
    hasIncome: (date: Date) => getIncomesForDate(date).length > 0,
  };

  const modifiersClassNames = {
    hasRecurringBills: 'bg-purple-100 text-purple-900 hover:bg-purple-200',
    hasIncome: 'bg-blue-100 text-blue-900 hover:bg-blue-200',
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className={cn("p-3 pointer-events-auto scale-90 sm:scale-100")}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 sm:mt-4 justify-center">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-purple-100 border border-purple-300"></div>
              <span className="text-xs sm:text-sm">Recurring Bills</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-xs sm:text-sm">Income</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Bills and income scheduled for this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedItems.bills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Bills</h4>
                <div className="space-y-2">
                  {selectedItems.bills.map(bill => (
                    <div key={bill.id} className="flex items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-medium text-sm truncate">{bill.name}</span>
                          {bill.is_paid ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs w-fit">Paid</Badge>
                          ) : isBefore(parseISO(bill.due_date), now) ? (
                            <Badge variant="destructive" className="text-xs w-fit">Overdue</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs w-fit">Unpaid</Badge>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
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
                          className="shrink-0 h-8 w-8 p-0"
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItems.recurringBills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Recurring Bills (Not Yet Created)</h4>
                <div className="space-y-2">
                  {selectedItems.recurringBills.map(recurringBill => (
                    <div key={recurringBill.id} className="flex items-start justify-between p-2 sm:p-3 border rounded-lg bg-purple-50 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-medium text-sm truncate">{recurringBill.name}</span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs w-fit">Recurring</Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {recurringBill.amount ? `$${Number(recurringBill.amount).toFixed(2)} • ` : ''}{recurringBill.category}
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
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Income</h4>
                <div className="space-y-2">
                  {selectedItems.incomes.map(income => (
                    <div key={income.id} className="flex items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg bg-blue-50 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-medium text-sm truncate">{income.name}</span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs w-fit">Income</Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
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
                          className="shrink-0 h-8 w-8 p-0"
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
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
