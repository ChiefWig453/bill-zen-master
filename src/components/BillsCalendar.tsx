import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bill } from '@/hooks/useBills';
import { Income } from '@/types/income';
import { format, isSameDay, isBefore, parseISO } from 'date-fns';
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
  onEditBill?: (bill: Bill) => void;
  onEditIncome?: (income: Income) => void;
}

export const BillsCalendar = ({ bills, incomes, onEditBill, onEditIncome }: BillsCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ bills: Bill[], incomes: Income[] }>({ bills: [], incomes: [] });

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

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateBills = getBillsForDate(date);
      const dateIncomes = getIncomesForDate(date);
      
      if (dateBills.length > 0 || dateIncomes.length > 0) {
        setSelectedItems({ bills: dateBills, incomes: dateIncomes });
        setShowDetailsDialog(true);
      }
    }
  };

  const modifiers = {
    hasBills: (date: Date) => getBillsForDate(date).length > 0,
    hasIncome: (date: Date) => getIncomesForDate(date).length > 0,
    overdue: (date: Date) => {
      const dateBills = getBillsForDate(date);
      return dateBills.some(bill => !bill.is_paid && isBefore(parseISO(bill.due_date), now));
    },
  };

  const modifiersClassNames = {
    hasBills: 'bg-green-100 text-green-900 hover:bg-green-200',
    hasIncome: 'bg-blue-100 text-blue-900 hover:bg-blue-200',
    overdue: 'bg-red-100 text-red-900 hover:bg-red-200',
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
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
              <span className="text-sm">Upcoming Bills</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
              <span className="text-sm">Overdue Bills</span>
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
