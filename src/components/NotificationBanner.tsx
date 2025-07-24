import { format, isAfter, isBefore, addDays } from 'date-fns';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bill } from '@/types/bill';
import { useState } from 'react';

interface NotificationBannerProps {
  bills: Bill[];
}

export const NotificationBanner = ({ bills }: NotificationBannerProps) => {
  const [dismissed, setDismissed] = useState<string[]>([]);
  
  const today = new Date();
  const threeDaysFromNow = addDays(today, 3);

  const overdueBills = bills.filter(bill => 
    !bill.isPaid && isBefore(new Date(bill.dueDate), today)
  );

  const dueSoonBills = bills.filter(bill => 
    !bill.isPaid && 
    isAfter(new Date(bill.dueDate), today) && 
    isBefore(new Date(bill.dueDate), threeDaysFromNow)
  );

  const notifications = [];

  if (overdueBills.length > 0) {
    notifications.push({
      id: 'overdue',
      type: 'danger' as const,
      title: `${overdueBills.length} overdue ${overdueBills.length === 1 ? 'bill' : 'bills'}`,
      description: overdueBills.map(bill => 
        `${bill.name} ($${bill.amount.toFixed(2)}) was due ${format(new Date(bill.dueDate), 'MMM dd')}`
      ).join(', ')
    });
  }

  if (dueSoonBills.length > 0) {
    notifications.push({
      id: 'due-soon',
      type: 'warning' as const,
      title: `${dueSoonBills.length} ${dueSoonBills.length === 1 ? 'bill' : 'bills'} due within 3 days`,
      description: dueSoonBills.map(bill => 
        `${bill.name} ($${bill.amount.toFixed(2)}) due ${format(new Date(bill.dueDate), 'MMM dd')}`
      ).join(', ')
    });
  }

  const visibleNotifications = notifications.filter(notif => !dismissed.includes(notif.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="space-y-3">
      {visibleNotifications.map((notification) => (
        <Alert key={notification.id} className={
          notification.type === 'danger' 
            ? 'border-danger/20 bg-danger/5' 
            : 'border-warning/20 bg-warning/5'
        }>
          <AlertTriangle className={
            notification.type === 'danger' ? 'h-4 w-4 text-danger' : 'h-4 w-4 text-warning'
          } />
          <AlertDescription className="flex items-start justify-between">
            <div>
              <div className="font-medium mb-1">{notification.title}</div>
              <div className="text-sm text-muted-foreground">{notification.description}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(prev => [...prev, notification.id])}
              className="h-6 w-6 p-0 ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};