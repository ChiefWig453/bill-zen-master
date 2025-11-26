import { RecurringBill } from '@/hooks/useRecurringBills';
import { Plus, Trash2, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Helper function for ordinal suffixes
const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

interface RecurringBillsTabProps {
  onCreateBillFromRecurringBill: (recurringBill: RecurringBill) => void | Promise<void>;
  recurringBills: RecurringBill[];
  isLoading: boolean;
  deleteRecurringBill: (id: string) => void | Promise<void>;
}

export const RecurringBillsTab = ({ onCreateBillFromRecurringBill, recurringBills, isLoading, deleteRecurringBill }: RecurringBillsTabProps) => {
  const { toast } = useToast();

  const handleCreateBill = (recurringBill: RecurringBill) => {
    onCreateBillFromRecurringBill(recurringBill);
    toast({
      title: "Bill created",
      description: `Creating new bill from ${recurringBill.name}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Recurring Bills</h2>
          <p className="text-muted-foreground">
            Manage your recurring bills with pre-filled information for quick bill creation.
          </p>
          {recurringBills.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <FileText className="h-4 w-4" />
                {recurringBills.length} recurring bill{recurringBills.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {recurringBills.filter(t => t.amount).length} ready for quick-create
              </span>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <FileText className="h-6 w-6 absolute top-3 left-3 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium">Loading recurring bills...</h3>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your recurring bills</p>
              </div>
            </div>
          ) : recurringBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="rounded-full bg-muted p-6">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2 max-w-md">
                <h3 className="text-lg font-semibold">No recurring bills yet</h3>
                <p className="text-muted-foreground">
                  You don't have any recurring bills saved. Recurring bills will appear here once created.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop & Tablet Table View */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-center">Due Day</TableHead>
                      <TableHead className="font-semibold text-center w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringBills.map((recurringBill) => (
                      <TableRow key={recurringBill.id} className="hover:bg-muted/30">
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-medium">{recurringBill.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Created {new Date(recurringBill.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="font-normal">
                            {recurringBill.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-right font-mono">
                          {recurringBill.amount != null && !Number.isNaN(Number(recurringBill.amount)) ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold">
                              ${Number(recurringBill.amount).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          {recurringBill.due_day ? (
                            <Badge variant="secondary" className="font-mono">
                              {recurringBill.due_day}{getOrdinalSuffix(recurringBill.due_day)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${recurringBill.name}"? This action cannot be undone.`)) {
                                  deleteRecurringBill(recurringBill.id);
                                }
                              }}
                              title={`Delete ${recurringBill.name}`}
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
              <div className="md:hidden space-y-3">
                {recurringBills.map((recurringBill) => (
                  <Card key={recurringBill.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base truncate">{recurringBill.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(recurringBill.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${recurringBill.name}"? This action cannot be undone.`)) {
                                  deleteRecurringBill(recurringBill.id);
                                }
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Category</p>
                            <Badge variant="outline" className="font-normal text-xs">
                              {recurringBill.category}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Due Day</p>
                            {recurringBill.due_day ? (
                              <Badge variant="secondary" className="font-mono text-xs">
                                {recurringBill.due_day}{getOrdinalSuffix(recurringBill.due_day)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Amount</p>
                          {recurringBill.amount != null && !Number.isNaN(Number(recurringBill.amount)) ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold text-lg">
                              ${Number(recurringBill.amount).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Enhanced Summary Information */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Total Recurring Bills</span>
                    </div>
                    <div className="text-2xl font-bold">{recurringBills.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {recurringBills.length === 0 ? 'Create your first recurring bill' : 'Saved recurring bills ready to use'}
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Quick-Create Ready</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {recurringBills.filter(t => t.amount).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {recurringBills.filter(t => t.amount).length === 0 ? 'Add amounts to enable' : 'Recurring bills with preset amounts'}
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="h-4 w-4 rounded-full p-0" />
                      <span className="text-sm font-medium">Monthly Estimate</span>
                    </div>
                    <div className="text-2xl font-bold">
                      ${recurringBills.reduce((sum, recurringBill) => sum + (recurringBill.amount || 0), 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From recurring bills with amounts set
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Categories Used</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {new Set(recurringBills.map(t => t.category)).size}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Set(recurringBills.map(t => t.category)).size === 0 ? 'No categories yet' : 'Unique bill categories'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
    </div>
  );
};
