import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Receipt, Plus, Edit, Trash2, Copy, Check, X, Archive, ArchiveRestore, Eye, EyeOff, DollarSign, TrendingUp, CalendarDays as IncomeCalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { AddBillForm } from '@/components/AddBillForm';
import { AddTemplateForm } from '@/components/AddTemplateForm';
import { BillCard } from '@/components/BillCard';
import { BillStats } from '@/components/BillStats';
import { BillDuplicationDialog } from '@/components/BillDuplicationDialog';
import { Navigation } from '@/components/Navigation';
import { NotificationBanner } from '@/components/NotificationBanner';
import { BillStatus, BILL_CATEGORIES, Bill as LegacyBill } from '@/types/bill';
import { BillTemplate } from '@/types/billTemplate';
import { BillTemplatesTab } from '@/components/BillTemplatesTab';
import { AddIncomeForm } from '@/components/AddIncomeForm';
import { IncomeStats } from '@/components/IncomeStats';
import { IncomeTable } from '@/components/IncomeTable';
import { BillsDashboard } from '@/components/BillsDashboard';
import { useBills, Bill as DBBill } from '@/hooks/useBills';
import { useIncomes } from '@/hooks/useIncomes';
import { Income, INCOME_CATEGORIES } from '@/types/income';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBillTemplatesSecure } from '@/hooks/useBillTemplatesSecure';

const Index = () => {
  const [editingBill, setEditingBill] = useState<DBBill | null>(null);
  const [showAddTemplateForm, setShowAddTemplateForm] = useState(false);
  const [showEditBillForm, setShowEditBillForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showArchived, setShowArchived] = useState(false);
  const [duplicatingBill, setDuplicatingBill] = useState<DBBill | null>(null);
  
  // Income state
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false);
  const [incomeFilter, setIncomeFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { bills, isLoading, addBill, updateBill, deleteBill, duplicateBill } = useBills();
  const { incomes, isLoading: isLoadingIncomes, addIncome, updateIncome, deleteIncome, markIncomeReceived } = useIncomes();
  const { templates } = useBillTemplatesSecure();

  // Convert database Bill to legacy Bill format for components
  const convertToLegacyBill = (dbBill: DBBill): LegacyBill => ({
    id: dbBill.id,
    name: dbBill.name,
    amount: dbBill.amount,
    dueDate: dbBill.due_date,
    category: dbBill.category,
    isPaid: dbBill.is_paid,
    isArchived: dbBill.is_archived,
    createdAt: dbBill.created_at
  });

  const legacyBills = bills.map(convertToLegacyBill);

  // Show authentication message if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to access your bills and start managing your finances securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your bill data is now stored securely in the database and requires authentication to access.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleAddBill = async (legacyBill: Omit<LegacyBill, 'id' | 'createdAt'>) => {
    console.log('handleAddBill called with:', legacyBill);
    
    const newBill: Omit<DBBill, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
      name: legacyBill.name,
      amount: legacyBill.amount,
      due_date: legacyBill.dueDate,
      category: legacyBill.category,
      is_paid: legacyBill.isPaid || false,
      is_archived: legacyBill.isArchived || false,
    };
    
    console.log('Converted to DB format:', newBill);
    
    try {
      console.log('Calling addBill function...');
      const result = await addBill(newBill);
      console.log('addBill result:', result);
      setShowEditBillForm(false);
      toast({
        title: "Success",
        description: "Bill created successfully!",
      });
    } catch (error) {
      console.error('Error in handleAddBill:', error);
      toast({
        title: "Error",
        description: "Failed to create bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateBillFromTemplate = async (template: BillTemplate) => {
    // Helper to compute due date based on template.due_day
    const computeDueDate = (due_day?: number | null): string => {
      const now = new Date();
      if (!due_day) return now.toISOString().slice(0, 10);
      let year = now.getFullYear();
      let month = now.getMonth(); // 0-based
      const today = new Date(year, month, now.getDate());
      const daysInThisMonth = new Date(year, month + 1, 0).getDate();
      const dayThisMonth = Math.min(due_day, daysInThisMonth);
      let candidate = new Date(year, month, dayThisMonth);
      if (candidate < today) {
        // Move to next month
        month += 1;
        if (month > 11) { month = 0; year += 1; }
        const daysInNextMonth = new Date(year, month + 1, 0).getDate();
        const dayNextMonth = Math.min(due_day, daysInNextMonth);
        candidate = new Date(year, month, dayNextMonth);
      }
      return candidate.toISOString().slice(0, 10);
    };

    try {
      if (template.amount == null) {
        toast({
          title: "Template missing amount",
          description: "Please add an amount to this template or use Add Bill to set it.",
          variant: "destructive",
        });
        // Just show message, don't open form
        return;
      }

      const newBill: Omit<DBBill, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
        name: template.name,
        amount: template.amount,
        category: template.category,
        due_date: computeDueDate(template.due_day ?? undefined),
        is_paid: false,
        is_archived: false,
      };

      console.log('Creating bill from template:', template, '->', newBill);
      await addBill(newBill);
      toast({ title: 'Bill created', description: `${template.name} scheduled for ${newBill.due_date}.` });
    } catch (error) {
      console.error('Error creating bill from template:', error);
      toast({ title: 'Error', description: 'Failed to create bill from template.', variant: 'destructive' });
    }
  };

  const handleUpdateBill = async (updatedBill: DBBill) => {
    try {
      await updateBill(updatedBill.id, updatedBill);
      setEditingBill(null);
      toast({
        title: "Bill updated successfully",
        description: `${updatedBill.name} has been updated.`,
      });
    } catch (error) {
      // Error is handled in the useBills hook
    }
  };

  const handleDeleteBill = async (billId: string) => {
    try {
      await deleteBill(billId);
    } catch (error) {
      // Error is handled in the useBills hook
    }
  };

  const handleTogglePaid = async (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      try {
        await updateBill(billId, { is_paid: !bill.is_paid });
      } catch (error) {
        // Error is handled in the useBills hook
      }
    }
  };

  const handleArchiveBill = async (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      try {
        await updateBill(billId, { is_archived: !bill.is_archived });
      } catch (error) {
        // Error is handled in the useBills hook
      }
    }
  };

  // Income handlers
  const handleAddIncome = async (incomeData: Omit<Income, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await addIncome(incomeData);
      setShowAddIncomeForm(false);
      setEditingIncome(null);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setShowAddIncomeForm(true);
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteIncome(id);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const filteredIncomes = incomes.filter(income => {
    if (incomeFilter !== 'all' && income.category !== incomeFilter) return false;
    return true;
  });

  const receivedIncomes = filteredIncomes.filter(income => income.is_received);
  const pendingIncomes = filteredIncomes.filter(income => !income.is_received);

  const handleDuplicateBill = async (originalBill: DBBill) => {
    try {
      await duplicateBill(originalBill.id);
      setDuplicatingBill(null);
    } catch (error) {
      // Error is handled in the useBills hook
    }
  };

  const filteredBills = bills.filter(bill => {
    if (!showArchived && bill.is_archived) return false;
    if (showArchived && !bill.is_archived) return false;
    if (categoryFilter !== 'all' && bill.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && getStatus(bill) !== statusFilter) return false;
    return true;
  });

  const sortedBills = [...filteredBills].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'due_date':
        aValue = new Date(a.due_date);
        bValue = new Date(b.due_date);
        break;
      case 'category':
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      case 'status':
        aValue = getStatus(a);
        bValue = getStatus(b);
        break;
      default:
        aValue = new Date(a.due_date);
        bValue = new Date(b.due_date);
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const paidBills = sortedBills.filter(bill => bill.is_paid);
  const unpaidBills = sortedBills.filter(bill => !bill.is_paid);

  const getStatus = (bill: DBBill): BillStatus => {
    if (bill.is_paid) return 'paid' as BillStatus;
    
    const today = new Date();
    const dueDate = new Date(bill.due_date);
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 3) return 'due-soon';
    return 'upcoming';
  };

  const formatDateSafely = (dateString: string) => {
    // Parse the date string safely to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return format(date, 'MMM dd, yyyy');
  };

  const getStatusBadge = (bill: DBBill) => {
    const status = getStatus(bill);
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'due-soon':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Due Soon</Badge>;
      default:
        return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Loading your bills...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">My Bills</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Stay on top of your bills and never miss a payment
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="font-medium text-sm sm:text-base">{format(new Date(), 'EEEE, MMM dd')}</p>
            </div>
          </div>

          {/* Notifications */}
          <NotificationBanner bills={legacyBills} />

          {/* Controls */}
          <div className="flex items-center justify-end">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAddIncomeForm(!showAddIncomeForm);
                  if (editingIncome) setEditingIncome(null);
                }}
                className="gap-2 w-full sm:w-auto"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="sm:inline">Add Income</span>
              </Button>
              
              <Button 
                onClick={() => {
                  setShowAddTemplateForm(!showAddTemplateForm);
                }}
                className="gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Add Bill</span>
              </Button>
            </div>
          </div>

          {/* Add Template Form */}
          {showAddTemplateForm && (
            <AddTemplateForm
              onCancel={() => setShowAddTemplateForm(false)}
            />
          )}

          {/* Edit Bill Form */}
          {showEditBillForm && editingBill && (
            <AddBillForm
              onAddBill={handleAddBill}
              editingBill={convertToLegacyBill(editingBill)}
              onCancelEdit={() => {
                setEditingBill(null);
                setShowEditBillForm(false);
              }}
              onCancelAdd={() => {
                setShowEditBillForm(false);
              }}
            />
          )}

          {showAddIncomeForm && (
            <AddIncomeForm
              onAddIncome={handleAddIncome}
              editingIncome={editingIncome}
              onCancel={() => {
                setShowAddIncomeForm(false);
                setEditingIncome(null);
              }}
            />
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="templates" className="text-xs sm:text-sm">Recurring</TabsTrigger>
              <TabsTrigger value="income" className="text-xs sm:text-sm">Income</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <BillsDashboard 
                bills={bills}
                incomes={incomes}
                templates={templates}
                onEditBill={(bill) => {
                  setEditingBill(bill);
                  setShowEditBillForm(true);
                }}
                onEditIncome={(income) => {
                  handleEditIncome(income);
                }}
                onBillUpdated={() => {
                  // Bills will automatically update via realtime subscription
                }}
              />
            </TabsContent>

            <TabsContent value="income">
          <div className="space-y-4 sm:space-y-6">
            {/* Enhanced Income Header */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    Income Management
                  </h2>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Track all your income sources for better financial planning and budgeting
                  </p>
                </div>
              </div>
              
              {incomes.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    {incomes.length} source{incomes.length !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                    ${receivedIncomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)} received
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <IncomeCalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    ${pendingIncomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)} pending
                  </span>
                </div>
              )}
            </div>

            {/* Enhanced Income Filter Controls */}
            <Card className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Filter by Category</Label>
                  <Select value={incomeFilter} onValueChange={setIncomeFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background border shadow-md">
                      <SelectItem value="all">All Categories</SelectItem>
                      {INCOME_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category} className="cursor-pointer">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIncomeFilter('all')}
                    size="sm"
                    className="text-xs w-full sm:w-auto"
                    disabled={incomeFilter === 'all'}
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAddIncomeForm(!showAddIncomeForm);
                      if (editingIncome) setEditingIncome(null);
                    }}
                    className="gap-2 w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sm:inline">Add Income</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Income Tables */}
            <div className="space-y-6">
              <IncomeTable
                incomes={pendingIncomes}
                onEdit={handleEditIncome}
                onDelete={handleDeleteIncome}
                onToggleReceived={markIncomeReceived}
                title="Pending Income"
                icon={<IncomeCalendarIcon className="h-5 w-5 text-yellow-500" />}
              />
              
              <IncomeTable
                incomes={receivedIncomes}
                onEdit={handleEditIncome}
                onDelete={handleDeleteIncome}
                onToggleReceived={markIncomeReceived}
                title="Received Income"
                icon={<Check className="h-5 w-5 text-green-500" />}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <BillTemplatesTab onCreateBillFromTemplate={handleCreateBillFromTemplate} />
        </TabsContent>
      </Tabs>

          {/* Duplication Dialog */}
          {duplicatingBill && (
            <BillDuplicationDialog
              bill={{
                ...duplicatingBill,
                dueDate: duplicatingBill.due_date,
                isPaid: duplicatingBill.is_paid,
                isArchived: duplicatingBill.is_archived,
                createdAt: duplicatingBill.created_at
              }}
              isOpen={!!duplicatingBill}
              onClose={() => setDuplicatingBill(null)}
              onDuplicate={(billData) => {
                handleDuplicateBill(duplicatingBill);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;