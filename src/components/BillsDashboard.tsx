import { BillsCalendar } from './BillsCalendar';
import { UpcomingBillsTable } from './UpcomingBillsTable';
import { Bill } from '@/hooks/useBills';
import { Income } from '@/types/income';

interface BillsDashboardProps {
  bills: Bill[];
  incomes: Income[];
  onEditBill?: (bill: Bill) => void;
  onEditIncome?: (income: Income) => void;
  onBillUpdated?: () => void;
}

export const BillsDashboard = ({ 
  bills, 
  incomes, 
  onEditBill, 
  onEditIncome,
  onBillUpdated 
}: BillsDashboardProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <BillsCalendar 
          bills={bills} 
          incomes={incomes}
          onEditBill={onEditBill}
          onEditIncome={onEditIncome}
        />
        <div className="lg:col-span-2">
          <UpcomingBillsTable 
            bills={bills} 
            onEditBill={onEditBill}
            onBillUpdated={onBillUpdated}
          />
        </div>
      </div>
    </div>
  );
};
