import { format } from 'date-fns';
import { Edit, Trash2, Check, X, Calendar, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Income } from '@/types/income';

interface IncomeTableProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onToggleReceived: (id: string) => void;
  title: string;
  icon: React.ReactNode;
}

export const IncomeTable = ({ 
  incomes, 
  onEdit, 
  onDelete, 
  onToggleReceived, 
  title, 
  icon 
}: IncomeTableProps) => {
  const formatDateSafely = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'MMM dd, yyyy');
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors: Record<string, string> = {
      'one-time': 'bg-gray-50 text-gray-700 border-gray-200',
      'weekly': 'bg-blue-50 text-blue-700 border-blue-200',
      'bi-weekly': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'monthly': 'bg-green-50 text-green-700 border-green-200',
      'annually': 'bg-purple-50 text-purple-700 border-purple-200',
    };
    
    return (
      <Badge variant="outline" className={colors[frequency] || 'bg-gray-50 text-gray-700 border-gray-200'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    return <Badge variant="outline">{category}</Badge>;
  };

  const getStatusBadge = (income: Income) => {
    return income.is_received 
      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Received</Badge>
      : <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          <span className="text-sm text-muted-foreground">({incomes.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incomes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Next Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {income.name}
                      {income.is_recurring && (
                        <Repeat className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(income.category)}</TableCell>
                  <TableCell className="font-semibold">${income.amount.toFixed(2)}</TableCell>
                  <TableCell>{getFrequencyBadge(income.frequency)}</TableCell>
                  <TableCell>
                    {income.date_received ? formatDateSafely(income.date_received) : 'Not received'}
                  </TableCell>
                  <TableCell>
                    {income.next_date ? formatDateSafely(income.next_date) : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(income)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onToggleReceived(income.id)}
                        className="gap-1"
                        title={income.is_received ? 'Mark as pending' : 'Mark as received'}
                      >
                        {income.is_received ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onEdit(income)}
                        title="Edit income"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onDelete(income.id)}
                        title="Delete income"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No income entries found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};