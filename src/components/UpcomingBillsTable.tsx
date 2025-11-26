import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bill } from '@/hooks/useBills';
import { format, addDays, isBefore, parseISO, startOfDay } from 'date-fns';
import { Check, Pencil } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

interface UpcomingBillsTableProps {
  bills: Bill[];
  onEditBill?: (bill: Bill) => void;
  onBillUpdated?: () => void;
}

export const UpcomingBillsTable = ({ bills, onEditBill, onBillUpdated }: UpcomingBillsTableProps) => {
  const { toast } = useToast();
  const [updatingBills, setUpdatingBills] = useState<Set<string>>(new Set());
  const today = startOfDay(new Date());
  const next30Days = addDays(today, 30);

  const upcomingBills = bills
    .filter(bill => {
      const dueDate = parseISO(bill.due_date);
      return !bill.is_archived && dueDate >= today && dueDate <= next30Days;
    })
    .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime());

  const handleMarkAsPaid = async (billId: string) => {
    setUpdatingBills(prev => new Set(prev).add(billId));
    
    try {
      const result = await apiClient.updateBill(billId, { is_paid: true });

      if (result.error) throw new Error(result.error);

      toast({
        title: 'Success',
        description: 'Bill marked as paid',
      });

      onBillUpdated?.();
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bill',
        variant: 'destructive',
      });
    } finally {
      setUpdatingBills(prev => {
        const newSet = new Set(prev);
        newSet.delete(billId);
        return newSet;
      });
    }
  };

  const getBillStatus = (bill: Bill) => {
    const dueDate = parseISO(bill.due_date);
    
    if (bill.is_paid) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>;
    } else if (isBefore(dueDate, today)) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="secondary">Unpaid</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Bills (Next 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingBills.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No upcoming bills in the next 30 days
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.name}</TableCell>
                    <TableCell>${Number(bill.amount).toFixed(2)}</TableCell>
                    <TableCell>{format(parseISO(bill.due_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{bill.category}</TableCell>
                    <TableCell>{getBillStatus(bill)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!bill.is_paid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(bill.id)}
                            disabled={updatingBills.has(bill.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        {onEditBill && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditBill(bill)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
