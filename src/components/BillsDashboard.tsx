import { BillsCalendar } from './BillsCalendar';
import { UpcomingBillsTable } from './UpcomingBillsTable';
import { MonthlyBillsChecklist } from './MonthlyBillsChecklist';
import { Bill } from '@/hooks/useBills';
import { Income } from '@/types/income';
import { BillTemplate } from '@/hooks/useBillTemplatesSecure';

interface BillsDashboardProps {
  bills: Bill[];
  incomes: Income[];
  templates: BillTemplate[];
  onEditBill?: (bill: Bill) => void;
  onEditIncome?: (income: Income) => void;
  onBillUpdated?: () => void;
}

export const BillsDashboard = ({ 
  bills, 
  incomes,
  templates,
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
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingBillsTable 
          bills={bills} 
          onEditBill={onEditBill}
          onBillUpdated={onBillUpdated}
        />
        <MonthlyBillsChecklist
          templates={templates}
          bills={bills}
          onBillUpdated={onBillUpdated}
        />
      </div>
    </div>
  );
};
