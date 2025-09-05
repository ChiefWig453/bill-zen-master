import { format, isAfter, isBefore, addDays } from 'date-fns';
import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Income } from '@/types/income';

interface IncomeStatsProps {
  incomes: Income[];
}

export const IncomeStats = ({ incomes }: IncomeStatsProps) => {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);

  const stats = incomes.reduce((acc, income) => {
    const nextDate = income.next_date ? new Date(income.next_date) : null;
    
    acc.totalExpected += income.amount;
    
    if (income.is_received) {
      acc.received += income.amount;
      acc.receivedCount++;
    } else {
      acc.pending += income.amount;
      acc.pendingCount++;
      
      if (nextDate && isBefore(nextDate, thirtyDaysFromNow)) {
        acc.expectedSoon += income.amount;
        acc.expectedSoonCount++;
      }
    }
    
    if (income.is_recurring) {
      acc.recurring += income.amount;
      acc.recurringCount++;
    }
    
    return acc;
  }, {
    totalExpected: 0,
    received: 0,
    pending: 0,
    recurring: 0,
    expectedSoon: 0,
    receivedCount: 0,
    pendingCount: 0,
    recurringCount: 0,
    expectedSoonCount: 0
  });

  const statCards = [
    {
      title: 'Total Expected',
      value: `$${stats.totalExpected.toFixed(2)}`,
      count: incomes.length,
      icon: DollarSign,
      className: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
    },
    {
      title: 'Received',
      value: `$${stats.received.toFixed(2)}`,
      count: stats.receivedCount,
      icon: CheckCircle,
      className: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
    },
    {
      title: 'Recurring Income',
      value: `$${stats.recurring.toFixed(2)}`,
      count: stats.recurringCount,
      icon: TrendingUp,
      className: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
    },
    {
      title: 'Expected Soon',
      value: `$${stats.expectedSoon.toFixed(2)}`,
      count: stats.expectedSoonCount,
      icon: Calendar,
      className: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
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
                {stat.count} {stat.count === 1 ? 'income' : 'incomes'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};