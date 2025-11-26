import { useState } from 'react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { Calendar, DollarSign, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bill, BillStatus } from '@/types/bill';
import { BillDuplicationDialog } from '@/components/BillDuplicationDialog';
import { cn } from '@/lib/utils';

interface BillCardProps {
  bill: Bill;
  onTogglePaid: (id: string) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: string) => void;
  onDuplicate: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
}

const getBillStatus = (bill: Bill): BillStatus => {
  if (bill.isPaid) return 'paid';
  
  const today = new Date();
  const dueDate = new Date(bill.dueDate);
  const threeDaysFromNow = addDays(today, 3);
  
  if (isBefore(dueDate, today)) return 'overdue';
  if (isBefore(dueDate, threeDaysFromNow)) return 'due-soon';
  return 'upcoming';
};

const getStatusConfig = (status: BillStatus) => {
  switch (status) {
    case 'paid':
      return {
        icon: CheckCircle,
        variant: 'success' as const,
        label: 'Paid',
        className: 'border-success/20 bg-success/5'
      };
    case 'overdue':
      return {
        icon: XCircle,
        variant: 'danger' as const,
        label: 'Overdue',
        className: 'border-danger/20 bg-danger/5'
      };
    case 'due-soon':
      return {
        icon: AlertTriangle,
        variant: 'warning' as const,
        label: 'Due Soon',
        className: 'border-warning/20 bg-warning/5'
      };
    case 'upcoming':
      return {
        icon: Calendar,
        variant: 'secondary' as const,
        label: 'Upcoming',
        className: 'border-border/20'
      };
  }
};

export const BillCard = ({ bill, onTogglePaid, onEdit, onDelete, onDuplicate }: BillCardProps) => {
  const [showDuplicationDialog, setShowDuplicationDialog] = useState(false);
  const status = getBillStatus(bill);
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  const handleTogglePaid = () => {
    if (!bill.isPaid) {
      // Show duplication dialog when marking as paid
      setShowDuplicationDialog(true);
    }
    onTogglePaid(bill.id);
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg",
      config.className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={cn(
              "h-5 w-5",
              status === 'paid' && "text-success",
              status === 'overdue' && "text-danger", 
              status === 'due-soon' && "text-warning",
              status === 'upcoming' && "text-muted-foreground"
            )} />
            <div>
              <h3 className="font-semibold text-lg">{bill.name}</h3>
              <p className="text-sm text-muted-foreground">{bill.category}</p>
            </div>
          </div>
          <Badge variant={config.variant === 'success' ? 'default' : 
                          config.variant === 'danger' ? 'destructive' :
                          config.variant === 'warning' ? 'secondary' : 'outline'}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">${Number(bill.amount).toFixed(2)}</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Due</p>
            <p className="font-medium">{format(new Date(bill.dueDate), 'MMM dd, yyyy')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={bill.isPaid ? "outline" : "success"}
            size="sm"
            onClick={handleTogglePaid}
            className="flex-1"
          >
            {bill.isPaid ? 'Mark Unpaid' : 'Mark Paid'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(bill)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(bill.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
      
      <BillDuplicationDialog
        bill={bill}
        isOpen={showDuplicationDialog}
        onClose={() => setShowDuplicationDialog(false)}
        onDuplicate={onDuplicate}
      />
    </Card>
  );
};