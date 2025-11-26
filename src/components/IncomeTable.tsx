import { format } from 'date-fns';
import { Edit, Trash2, Check, X, Calendar, Repeat, Plus } from 'lucide-react';
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
    <Card className="overflow-hidden">
      <CardHeader className={`pb-3 md:pb-6 ${title.includes('Pending') ? 'bg-yellow-50/50 dark:bg-yellow-950/20' : 'bg-green-50/50 dark:bg-green-950/20'}`}>
        <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-base md:text-lg">{title}</span>
            <Badge 
              variant={title.includes('Pending') ? 'secondary' : 'outline'} 
              className={`text-xs ${title.includes('Pending') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}
            >
              {incomes.length}
            </Badge>
          </div>
          {incomes.length > 0 && (
            <div className="text-xs md:text-sm text-muted-foreground">
              Total: ${incomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)}
            </div>
          )}
        </CardTitle>
        {incomes.length > 0 && (
          <div className="text-xs md:text-sm text-muted-foreground">
            {title.includes('Pending') ? 
              `Waiting for ${incomes.length} income source${incomes.length !== 1 ? 's' : ''}` : 
              `Successfully received from ${incomes.length} source${incomes.length !== 1 ? 's' : ''}`
            }
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {incomes.length > 0 ? (
          <>
            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold w-[200px]">Income Source</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-center">Frequency</TableHead>
                  <TableHead className="font-semibold">Date Info</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-center w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((income) => (
                  <TableRow 
                    key={income.id}
                    className={`hover:bg-muted/30 animate-fade-in ${!income.is_received ? 'border-l-4 border-l-yellow-400 bg-yellow-50/20 dark:bg-yellow-950/10' : 'opacity-80 hover:opacity-100 transition-opacity'}`}
                  >
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {income.name}
                          {income.is_recurring && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                              <Repeat className="h-3 w-3 mr-1" />
                              Recurring
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added {format(new Date(income.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getCategoryBadge(income.category)}
                    </TableCell>
                    <TableCell className="py-4 text-right font-mono">
                      <span className={`font-semibold text-lg ${income.is_received ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        ${Number(income.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {getFrequencyBadge(income.frequency)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Received: </span>
                          <span className="font-medium">
                            {income.date_received ? formatDateSafely(income.date_received) : 'Not received'}
                          </span>
                        </div>
                        {income.next_date && (
                          <div>
                            <span className="text-muted-foreground">Next: </span>
                            <span className="font-medium">
                              {formatDateSafely(income.next_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      {getStatusBadge(income)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          size="sm" 
                          variant={income.is_received ? "outline" : "default"}
                          onClick={() => onToggleReceived(income.id)}
                          className={`gap-1 text-xs px-2 py-1 h-7 ${!income.is_received ? 'bg-green-600 hover:bg-green-700' : ''}`}
                          title={income.is_received ? 'Mark as pending' : 'Mark as received'}
                        >
                          {income.is_received ? (
                            <>
                              <X className="h-3 w-3" />
                              Undo
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" />
                              Receive
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onEdit(income)}
                          title="Edit income"
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${income.name}"? This action cannot be undone.`)) {
                              onDelete(income.id);
                            }
                          }}
                          title="Delete income"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-3">
            {incomes.map((income) => (
              <Card key={income.id} className={`overflow-hidden ${!income.is_received ? 'border-l-4 border-l-yellow-400' : ''}`}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-medium text-base">{income.name}</h3>
                          {income.is_recurring && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              <Repeat className="h-3 w-3 mr-1" />
                              Recurring
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added {format(new Date(income.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {getStatusBadge(income)}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Amount</p>
                        <span className={`font-semibold text-xl ${income.is_received ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                          ${Number(income.amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Frequency</p>
                        {getFrequencyBadge(income.frequency)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Category</p>
                        {getCategoryBadge(income.category)}
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground mb-1">Received</p>
                        <p className="font-medium">
                          {income.date_received ? formatDateSafely(income.date_received) : 'Not yet'}
                        </p>
                      </div>
                    </div>
                    
                    {income.next_date && (
                      <div className="text-xs pt-2 border-t">
                        <p className="text-muted-foreground mb-1">Next Expected</p>
                        <p className="font-medium">{formatDateSafely(income.next_date)}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        variant={income.is_received ? "outline" : "default"}
                        onClick={() => onToggleReceived(income.id)}
                        className={`flex-1 gap-1 text-xs h-9 ${!income.is_received ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        {income.is_received ? (
                          <>
                            <X className="h-3 w-3" />
                            Mark Pending
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3" />
                            Mark Received
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onEdit(income)}
                        className="h-9 w-9 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${income.name}"? This action cannot be undone.`)) {
                            onDelete(income.id);
                          }
                        }}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className={`rounded-full p-6 ${title.includes('Pending') ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              <Calendar className={`h-8 w-8 ${title.includes('Pending') ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`} />
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-lg font-semibold">
                {title.includes('Pending') ? 'No pending income' : 'No received income yet'}
              </h3>
              <p className="text-muted-foreground">
                {title.includes('Pending') ? 
                  'Income you\'re expecting will appear here once added.' : 
                  'Income you\'ve received will be tracked here for your records.'
                }
              </p>
            </div>
            {title.includes('Pending') && (
              <Button 
                onClick={() => {/* This would trigger add income form */}}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Income Source
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};