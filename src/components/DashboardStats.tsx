import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertCircle, CheckCircle, Receipt } from 'lucide-react';
import { Bill } from '@/hooks/useBills';
import { Income } from '@/types/income';
import { startOfMonth, endOfMonth, isBefore } from 'date-fns';

interface DashboardStatsProps {
  bills: Bill[];
  incomes: Income[];
}

export const DashboardStats = ({ bills, incomes }: DashboardStatsProps) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const billsDueThisMonth = bills.filter(bill => {
    const dueDate = new Date(bill.due_date);
    return dueDate >= monthStart && dueDate <= monthEnd;
  });

  const overdueBills = bills.filter(bill => {
    const dueDate = new Date(bill.due_date);
    return !bill.is_paid && isBefore(dueDate, now);
  });

  const paidBillsThisMonth = billsDueThisMonth.filter(bill => bill.is_paid);

  const totalDueAmount = billsDueThisMonth
    .filter(bill => !bill.is_paid)
    .reduce((sum, bill) => sum + Number(bill.amount), 0);

  const totalPaidAmount = paidBillsThisMonth.reduce(
    (sum, bill) => sum + Number(bill.amount),
    0
  );

  const stats = [
    {
      title: 'Total Due This Month',
      value: `$${Number(totalDueAmount).toFixed(2)}`,
      icon: DollarSign,
      description: `${billsDueThisMonth.filter(b => !b.is_paid).length} unpaid bills`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Overdue Bills',
      value: overdueBills.length.toString(),
      icon: AlertCircle,
      description: `$${overdueBills.reduce((sum, b) => sum + Number(b.amount), 0).toFixed(2)} overdue`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Paid This Month',
      value: `$${Number(totalPaidAmount).toFixed(2)}`,
      icon: CheckCircle,
      description: `${paidBillsThisMonth.length} bills paid`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Bills',
      value: bills.length.toString(),
      icon: Receipt,
      description: `${bills.filter(b => !b.is_archived).length} active bills`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
