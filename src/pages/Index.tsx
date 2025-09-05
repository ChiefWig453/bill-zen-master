import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Receipt, Plus, Edit, Trash2, Copy, Check, X, Archive, ArchiveRestore, Eye, EyeOff, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const newBill: Omit<DBBill, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
      name: legacyBill.name,
      amount: legacyBill.amount,
      due_date: legacyBill.dueDate,
      category: legacyBill.category,
      is_paid: legacyBill.isPaid || false,
      is_archived: legacyBill.isArchived || false,
    };
    try {
      await addBill(newBill);
      setShowAddForm(false);
    } catch (error) {
      // Error is handled in the useBills hook
    }
  };

  const handleCreateBillFromTemplate = (template: BillTemplate) => {
    // Pre-fill form with template data and show add form
    setShowAddForm(true);
    // You could also pre-populate a form here if needed
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
          <Tabs defaultValue="bills" className="space-y-6">
            <TabsList>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="income">Income ({incomes.length})</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="bills">
              <Tabs defaultValue="unpaid" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="unpaid">Unpaid Bills ({unpaidBills.length})</TabsTrigger>
                  <TabsTrigger value="paid">Paid Bills ({paidBills.length})</TabsTrigger>
                </TabsList>

            <TabsContent value="unpaid">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <X className="h-5 w-5 text-red-500" />
                    Unpaid Bills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {unpaidBills.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bill Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unpaidBills.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell className="font-medium">{bill.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{bill.category}</Badge>
                            </TableCell>
                            <TableCell>${bill.amount.toFixed(2)}</TableCell>
                            <TableCell>{formatDateSafely(bill.due_date)}</TableCell>
                            <TableCell>{getStatusBadge(bill)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleTogglePaid(bill.id)}
                                  className="gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingBill(bill);
                                    setShowAddForm(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setDuplicatingBill(bill)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleArchiveBill(bill.id)}
                                >
                                  {bill.is_archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteBill(bill.id)}
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
                      <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No unpaid bills found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paid">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    Paid Bills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paidBills.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bill Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidBills.map((bill) => (
                          <TableRow key={bill.id} className="opacity-75">
                            <TableCell className="font-medium">{bill.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{bill.category}</Badge>
                            </TableCell>
                            <TableCell>${bill.amount.toFixed(2)}</TableCell>
                            <TableCell>{formatDateSafely(bill.due_date)}</TableCell>
                            <TableCell>{getStatusBadge(bill)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleTogglePaid(bill.id)}
                                  className="gap-1"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingBill(bill);
                                    setShowAddForm(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setDuplicatingBill(bill)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleArchiveBill(bill.id)}
                                >
                                  {bill.is_archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                                </Button>
                                
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteBill(bill.id)}
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
                      <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No paid bills found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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