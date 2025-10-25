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

const Index = () => {
  const [editingBill, setEditingBill] = useState<DBBill | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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
      setShowAddForm(false);
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
        setShowAddForm(true);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Bills</h1>
                <p className="text-muted-foreground">
                  Stay on top of your bills and never miss a payment
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="font-medium">{format(new Date(), 'EEEE, MMM dd')}</p>
            </div>
          </div>

          {/* Notifications */}
          <NotificationBanner bills={legacyBills} />

          {/* Stats */}
          <BillStats bills={legacyBills} incomes={incomes} />

          {/* Income Stats */}
          <IncomeStats incomes={incomes} />

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {BILL_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bills</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="due-soon">Due Soon</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant={showArchived ? "default" : "outline"}
                onClick={() => setShowArchived(!showArchived)}
                className="gap-2"
              >
                {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAddIncomeForm(!showAddIncomeForm);
                  if (editingIncome) setEditingIncome(null);
                }}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Add Income
              </Button>
              
              <Button 
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  if (editingBill) setEditingBill(null);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Bill
              </Button>
            </div>
          </div>

          {/* Add/Edit Forms */}
          {showAddForm && (
            <AddBillForm
              onAddBill={handleAddBill}
              editingBill={editingBill ? convertToLegacyBill(editingBill) : null}
              onCancelEdit={() => {
                setEditingBill(null);
                setShowAddForm(false);
              }}
              onCancelAdd={() => {
                setShowAddForm(false);
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
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="income">Income ({incomes.length})</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <BillsDashboard 
                bills={bills}
                incomes={incomes}
                onEditBill={(bill) => {
                  setEditingBill(bill);
                  setShowAddForm(true);
                }}
                onEditIncome={(income) => {
                  handleEditIncome(income);
                }}
                onBillUpdated={() => {
                  // Bills will automatically update via realtime subscription
                }}
              />
            </TabsContent>

            <TabsContent value="bills">
              <Tabs defaultValue="unpaid" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="unpaid">Unpaid Bills ({unpaidBills.length})</TabsTrigger>
                  <TabsTrigger value="paid">Paid Bills ({paidBills.length})</TabsTrigger>
                </TabsList>

            <TabsContent value="unpaid">
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-red-50/50 dark:bg-red-950/20">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-md">
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <span>Unpaid Bills</span>
                        <Badge variant="destructive" className="ml-2">
                          {unpaidBills.length}
                        </Badge>
                      </div>
                      {unpaidBills.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Total: ${unpaidBills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                        </div>
                      )}
                    </CardTitle>
                    {unpaidBills.length > 0 && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          {unpaidBills.filter(b => getStatus(b) === 'overdue').length} overdue
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          {unpaidBills.filter(b => getStatus(b) === 'due-soon').length} due soon
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {unpaidBills.filter(b => getStatus(b) === 'upcoming').length} upcoming
                        </span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {unpaidBills.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="font-semibold w-[200px]">Bill</TableHead>
                              <TableHead className="font-semibold">Category</TableHead>
                              <TableHead className="font-semibold text-right">Amount</TableHead>
                              <TableHead className="font-semibold">Due Date</TableHead>
                              <TableHead className="font-semibold text-center">Status</TableHead>
                              <TableHead className="font-semibold text-center w-[200px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unpaidBills.map((bill) => {
                              const status = getStatus(bill);
                              const isUrgent = status === 'overdue' || status === 'due-soon';
                              return (
                                <TableRow 
                                  key={bill.id} 
                                  className={`hover:bg-muted/30 animate-fade-in ${isUrgent ? 'border-l-4 border-l-red-400 bg-red-50/30 dark:bg-red-950/10' : ''}`}
                                >
                                  <TableCell className="py-4">
                                    <div className="space-y-1">
                                      <div className="font-medium">{bill.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Added {format(new Date(bill.created_at), 'MMM dd')}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <Badge variant="outline" className="font-normal">
                                      {bill.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 text-right font-mono">
                                    <span className="font-semibold text-lg">
                                      ${bill.amount.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {formatDateSafely(bill.due_date)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {(() => {
                                          const today = new Date();
                                          const dueDate = new Date(bill.due_date);
                                          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                          if (daysDiff < 0) return `${Math.abs(daysDiff)} days overdue`;
                                          if (daysDiff === 0) return 'Due today';
                                          if (daysDiff === 1) return 'Due tomorrow';
                                          return `Due in ${daysDiff} days`;
                                        })()}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-center">
                                    {getStatusBadge(bill)}
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="default"
                                        onClick={() => handleTogglePaid(bill.id)}
                                        className="gap-1 bg-green-600 hover:bg-green-700 text-xs px-2 py-1 h-7"
                                        title="Mark as paid"
                                      >
                                        <Check className="h-3 w-3" />
                                        Pay
                                      </Button>
                                      
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingBill(bill);
                                          setShowAddForm(true);
                                        }}
                                        title="Edit bill"
                                        className="h-7 w-7 p-0"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => setDuplicatingBill(bill)}
                                        title="Duplicate bill"
                                        className="h-7 w-7 p-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => {
                                          if (confirm(`Are you sure you want to ${bill.is_archived ? 'unarchive' : 'archive'} "${bill.name}"?`)) {
                                            handleArchiveBill(bill.id);
                                          }
                                        }}
                                        title={bill.is_archived ? 'Unarchive bill' : 'Archive bill'}
                                        className="h-7 w-7 p-0"
                                      >
                                        {bill.is_archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                                      </Button>
                                      
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => {
                                          if (confirm(`Are you sure you want to delete "${bill.name}"? This action cannot be undone.`)) {
                                            handleDeleteBill(bill.id);
                                          }
                                        }}
                                        title="Delete bill"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
                          <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center space-y-2 max-w-md">
                          <h3 className="text-lg font-semibold">All bills are paid!</h3>
                          <p className="text-muted-foreground">
                            Great job staying on top of your finances. No unpaid bills found.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add New Bill
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="paid">
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-green-50/50 dark:bg-green-950/20">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Paid Bills</span>
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {paidBills.length}
                        </Badge>
                      </div>
                      {paidBills.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Total: ${paidBills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}
                        </div>
                      )}
                    </CardTitle>
                    {paidBills.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        You've successfully managed {paidBills.length} bill{paidBills.length !== 1 ? 's' : ''} this period
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-0">
                    {paidBills.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="font-semibold w-[200px]">Bill</TableHead>
                              <TableHead className="font-semibold">Category</TableHead>
                              <TableHead className="font-semibold text-right">Amount</TableHead>
                              <TableHead className="font-semibold">Due Date</TableHead>
                              <TableHead className="font-semibold text-center">Status</TableHead>
                              <TableHead className="font-semibold text-center w-[200px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paidBills.map((bill) => (
                              <TableRow 
                                key={bill.id} 
                                className="hover:bg-muted/30 animate-fade-in opacity-80 hover:opacity-100 transition-opacity"
                              >
                                <TableCell className="py-4">
                                  <div className="space-y-1">
                                    <div className="font-medium flex items-center gap-2">
                                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      {bill.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Paid • Added {format(new Date(bill.created_at), 'MMM dd')}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge variant="outline" className="font-normal">
                                    {bill.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4 text-right font-mono">
                                  <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                                    ${bill.amount.toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      {formatDateSafely(bill.due_date)}
                                    </div>
                                    <div className="text-xs text-green-600 dark:text-green-400">
                                      ✓ Completed
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-4 text-center">
                                  {getStatusBadge(bill)}
                                </TableCell>
                                <TableCell className="py-4">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleTogglePaid(bill.id)}
                                      className="gap-1 text-xs px-2 py-1 h-7"
                                      title="Mark as unpaid"
                                    >
                                      <X className="h-3 w-3" />
                                      Undo
                                    </Button>
                                    
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingBill(bill);
                                        setShowAddForm(true);
                                      }}
                                      title="Edit bill"
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => setDuplicatingBill(bill)}
                                      title="Duplicate bill"
                                      className="h-7 w-7 p-0"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to ${bill.is_archived ? 'unarchive' : 'archive'} "${bill.name}"?`)) {
                                          handleArchiveBill(bill.id);
                                        }
                                      }}
                                      title={bill.is_archived ? 'Unarchive bill' : 'Archive bill'}
                                      className="h-7 w-7 p-0"
                                    >
                                      {bill.is_archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                                    </Button>
                                    
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to delete "${bill.name}"? This action cannot be undone.`)) {
                                          handleDeleteBill(bill.id);
                                        }
                                      }}
                                      title="Delete bill"
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
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-6">
                          <Receipt className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-center space-y-2 max-w-md">
                          <h3 className="text-lg font-semibold">No paid bills yet</h3>
                          <p className="text-muted-foreground">
                            Once you mark bills as paid, they'll appear here for your records.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setShowAddForm(true)}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Bill
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {/* Switch to unpaid tab */}}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Unpaid
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="income">
          <div className="space-y-6">
            {/* Enhanced Income Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Income Management
                </h2>
                <p className="text-muted-foreground">
                  Track all your income sources for better financial planning and budgeting
                </p>
                {incomes.length > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {incomes.length} income source{incomes.length !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Check className="h-4 w-4" />
                      ${receivedIncomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)} received
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <IncomeCalendarIcon className="h-4 w-4" />
                      ${pendingIncomes.reduce((sum, income) => sum + income.amount, 0).toFixed(2)} pending
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Income Filter Controls */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Filter by Category</Label>
                    <Select value={incomeFilter} onValueChange={setIncomeFilter}>
                      <SelectTrigger className="w-48">
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
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIncomeFilter('all')}
                    size="sm"
                    className="text-xs"
                    disabled={incomeFilter === 'all'}
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAddIncomeForm(!showAddIncomeForm);
                      if (editingIncome) setEditingIncome(null);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Income
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