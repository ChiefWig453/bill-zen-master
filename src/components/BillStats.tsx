import { format, isAfter, isBefore, addDays } from 'date-fns';
import { DollarSign, Calendar, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bill } from '@/types/bill';
import { Income } from '@/types/income';

interface BillStatsProps {
  bills: Bill[];
  incomes?: Income[];
}

export const BillStats = ({ bills, incomes = [] }: BillStatsProps) => {
  const today = new Date();
  const threeDaysFromNow = addDays(today, 3);

  const stats = bills.reduce((acc, bill) => {
    const dueDate = new Date(bill.dueDate);
    
    acc.total += Number(bill.amount);
    
    if (bill.isPaid) {
      acc.paid += Number(bill.amount);
      acc.paidCount++;
    } else {
      acc.unpaid += Number(bill.amount);
      acc.unpaidCount++;
      
      if (isBefore(dueDate, today)) {
        acc.overdue += Number(bill.amount);
        acc.overdueCount++;
      } else if (isBefore(dueDate, threeDaysFromNow)) {
        acc.dueSoon += Number(bill.amount);
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

  // Calculate income stats
  const incomeStats = incomes.reduce((acc, income) => {
    acc.totalIncome += Number(income.amount);
    
    if (income.is_received) {
      acc.receivedIncome += Number(income.amount);
      acc.receivedCount++;
    } else {
      acc.pendingIncome += Number(income.amount);
      acc.pendingCount++;
    }
    
    return acc;
  }, {
    totalIncome: 0,
    receivedIncome: 0,
    pendingIncome: 0,
    receivedCount: 0,
    pendingCount: 0
  });

  // Calculate net income (received income - paid bills)
  const netIncome = incomeStats.receivedIncome - stats.paid;

  const statCards = [
    {
      title: 'Total Bills',
      value: `$${stats.total.toFixed(2)}`,
      count: bills.length,
      icon: DollarSign,
      className: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
    },
    {
      title: 'Total Income',
      value: `$${incomeStats.receivedIncome.toFixed(2)}`,
      count: incomeStats.receivedCount,
      icon: TrendingUp,
      className: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
    },
    {
      title: 'Net Income',
      value: `${netIncome >= 0 ? '+' : ''}$${netIncome.toFixed(2)}`,
      count: incomes.length + bills.length,
      icon: netIncome >= 0 ? TrendingUp : TrendingDown,
      className: netIncome >= 0 
        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
        : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
    },
    {
      title: 'Due Soon',
      value: `$${stats.dueSoon.toFixed(2)}`,
      count: stats.dueSoonCount,
      icon: Calendar,
      className: 'bg-gradient-to-br from-warning/10 to-warning/20 border-warning/20'
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
                {stat.title === 'Total Bills' ? `${stat.count} ${stat.count === 1 ? 'bill' : 'bills'}` :
                 stat.title === 'Total Income' ? `${stat.count} ${stat.count === 1 ? 'income' : 'incomes'}` :
                 stat.title === 'Net Income' ? `${stat.count} ${stat.count === 1 ? 'item' : 'items'}` :
                 `${stat.count} ${stat.count === 1 ? 'bill' : 'bills'}`}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};