import { format, isAfter, isBefore, addDays } from 'date-fns';
import { DollarSign, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bill } from '@/types/bill';

interface BillStatsProps {
  bills: Bill[];
}

export const BillStats = ({ bills }: BillStatsProps) => {
  const today = new Date();
  const threeDaysFromNow = addDays(today, 3);

  const stats = bills.reduce((acc, bill) => {
    const dueDate = new Date(bill.dueDate);
    
    acc.total += bill.amount;
    
    if (bill.isPaid) {
      acc.paid += bill.amount;
      acc.paidCount++;
    } else {
      acc.unpaid += bill.amount;
      acc.unpaidCount++;
      
      if (isBefore(dueDate, today)) {
        acc.overdue += bill.amount;
        acc.overdueCount++;
      } else if (isBefore(dueDate, threeDaysFromNow)) {
        acc.dueSoon += bill.amount;
        acc.dueSoonCount++;
      }
    }
    
    return acc;
  }, {
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    dueSoon: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0,
    dueSoonCount: 0
  });

  const statCards = [
    {
      title: 'Total Bills',
      value: `$${stats.total.toFixed(2)}`,
      count: bills.length,
      icon: DollarSign,
      className: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
    },
    {
      title: 'Paid',
      value: `$${stats.paid.toFixed(2)}`,
      count: stats.paidCount,
      icon: CheckCircle,
      className: 'bg-gradient-to-br from-success/10 to-success/20 border-success/20'
    },
    {
      title: 'Due Soon',
      value: `$${stats.dueSoon.toFixed(2)}`,
      count: stats.dueSoonCount,
      icon: Calendar,
      className: 'bg-gradient-to-br from-warning/10 to-warning/20 border-warning/20'
    },
    {
      title: 'Overdue',
      value: `$${stats.overdue.toFixed(2)}`,
      count: stats.overdueCount,
      icon: AlertTriangle,
      className: 'bg-gradient-to-br from-danger/10 to-danger/20 border-danger/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={stat.className}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.count} {stat.count === 1 ? 'bill' : 'bills'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};