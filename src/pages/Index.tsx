import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Receipt, Plus, Edit, Trash2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BillCard } from '@/components/BillCard';
import { AddBillForm } from '@/components/AddBillForm';
import { BillStats } from '@/components/BillStats';
import { NotificationBanner } from '@/components/NotificationBanner';
import { BillDuplicationDialog } from '@/components/BillDuplicationDialog';
import { Navigation } from '@/components/Navigation';
import { Bill } from '@/types/bill';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [duplicatingBill, setDuplicatingBill] = useState<Bill | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { user } = useAuth();
  const { allCategories } = useCategories();
  const { toast } = useToast();

  // Load bills from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedBills = localStorage.getItem(`bills_${user.id}`);
      if (savedBills) {
        setBills(JSON.parse(savedBills));
      } else {
        // Add sample bills for demo
        const sampleBills: Bill[] = [
          {
            id: '1',
            name: 'Electric Bill',
            amount: 125.50,
            dueDate: '2024-01-28',
            category: 'Utilities',
            isPaid: false,
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Netflix Subscription',
            amount: 15.99,
            dueDate: '2024-01-25',
            category: 'Subscription',
            isPaid: true,
            createdAt: new Date().toISOString()
          }
        ];
        setBills(sampleBills);
        localStorage.setItem(`bills_${user.id}`, JSON.stringify(sampleBills));
      }
    }
  }, [user]);

  // Save bills to localStorage whenever bills change
  useEffect(() => {
    if (user && bills.length > 0) {
      localStorage.setItem(`bills_${user.id}`, JSON.stringify(bills));
    }
  }, [bills, user]);

  const addBill = (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    if (editingBill) {
      setBills(prev => prev.map(bill => 
        bill.id === editingBill.id ? { ...newBill, id: editingBill.id, createdAt: editingBill.createdAt } : bill
      ));
      setEditingBill(null);
      toast({
        title: "Bill updated",
        description: `${billData.name} has been updated successfully.`,
      });
    } else {
      setBills(prev => [...prev, newBill]);
      toast({
        title: "Bill added",
        description: `${billData.name} has been added successfully.`,
      });
    }
    
    setShowAddForm(false);
  };

  const togglePaid = (id: string) => {
    setBills(prev => prev.map(bill => 
      bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
    ));
    
    const bill = bills.find(b => b.id === id);
    if (bill) {
      toast({
        title: bill.isPaid ? "Bill marked as unpaid" : "Bill marked as paid",
        description: `${bill.name} status updated.`,
      });
    }
  };

  const editBill = (bill: Bill) => {
    setEditingBill(bill);
    setShowAddForm(true);
  };

  const deleteBill = (id: string) => {
    const bill = bills.find(b => b.id === id);
    setBills(prev => prev.filter(bill => bill.id !== id));
    
    if (bill) {
      toast({
        title: "Bill deleted",
        description: `${bill.name} has been deleted.`,
      });
    }
  };

  const openDuplicationDialog = (bill: Bill) => {
    setDuplicatingBill(bill);
  };

  const handleDuplicate = (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setBills(prev => [...prev, newBill]);
    setDuplicatingBill(null);
    toast({
      title: "Bill duplicated",
      description: `${billData.name} has been created for next month.`,
    });
  };

  const cancelEdit = () => {
    setEditingBill(null);
    setShowAddForm(false);
  };

  // Filter bills
  const filteredBills = bills.filter(bill => {
    const categoryMatch = filterCategory === 'all' || bill.category === filterCategory;
    
    let statusMatch = true;
    if (filterStatus === 'paid') statusMatch = bill.isPaid;
    if (filterStatus === 'unpaid') statusMatch = !bill.isPaid;
    
    return categoryMatch && statusMatch;
  });

  // Group bills by category and payment status
  const groupedBills = filteredBills.reduce((acc, bill) => {
    if (!acc[bill.category]) {
      acc[bill.category] = { paid: [], unpaid: [] };
    }
    if (bill.isPaid) {
      acc[bill.category].paid.push(bill);
    } else {
      acc[bill.category].unpaid.push(bill);
    }
    return acc;
  }, {} as Record<string, { paid: Bill[], unpaid: Bill[] }>);

  // Sort bills within each group by due date
  Object.keys(groupedBills).forEach(category => {
    groupedBills[category].paid.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    groupedBills[category].unpaid.sort((a, b) => {
      const aDate = new Date(a.dueDate);
      const bDate = new Date(b.dueDate);
      const today = new Date();
      
      const aOverdue = aDate < today;
      const bOverdue = bDate < today;
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      return aDate.getTime() - bDate.getTime();
    });
  });

  const getBillStatus = (bill: Bill) => {
    const today = new Date();
    const dueDate = new Date(bill.dueDate);
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (bill.isPaid) return 'paid';
    if (daysDiff < 0) return 'overdue';
    if (daysDiff <= 3) return 'due-soon';
    return 'upcoming';
  };

  const getStatusBadge = (bill: Bill) => {
    const status = getBillStatus(bill);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
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
        <NotificationBanner bills={bills} />

        {/* Stats */}
        <BillStats bills={bills} />

        {/* Add Bill Button & Form */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bills</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <AddBillForm
            onAddBill={addBill}
            editingBill={editingBill}
            onCancelEdit={cancelEdit}
          />
        )}

        {/* Bills Tables */}
        {Object.keys(groupedBills).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedBills).map(([category, { paid, unpaid }]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{category}</h2>
                  <Badge variant="outline">
                    {paid.length + unpaid.length} bill{paid.length + unpaid.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Unpaid Bills */}
                {unpaid.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <X className="h-5 w-5 text-red-500" />
                        Unpaid Bills ({unpaid.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bill Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unpaid.map((bill) => (
                            <TableRow key={bill.id}>
                              <TableCell className="font-medium">{bill.name}</TableCell>
                              <TableCell>${bill.amount.toFixed(2)}</TableCell>
                              <TableCell>{format(new Date(bill.dueDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell>{getStatusBadge(bill)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => togglePaid(bill.id)}
                                    className="gap-1"
                                  >
                                    <Check className="h-3 w-3" />
                                    Mark Paid
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => editBill(bill)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openDuplicationDialog(bill)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => deleteBill(bill.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Paid Bills */}
                {paid.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        Paid Bills ({paid.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bill Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paid.map((bill) => (
                            <TableRow key={bill.id} className="opacity-75">
                              <TableCell className="font-medium">{bill.name}</TableCell>
                              <TableCell>${bill.amount.toFixed(2)}</TableCell>
                              <TableCell>{format(new Date(bill.dueDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell>{getStatusBadge(bill)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => togglePaid(bill.id)}
                                    className="gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Mark Unpaid
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => editBill(bill)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => openDuplicationDialog(bill)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => deleteBill(bill.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No bills found</h3>
            <p className="text-muted-foreground mb-4">
              {bills.length === 0 
                ? "Get started by adding your first bill"
                : "No bills match your current filters"
              }
            </p>
            {bills.length === 0 && (
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Bill
              </Button>
            )}
          </div>
        )}

        {/* Duplication Dialog */}
        {duplicatingBill && (
          <BillDuplicationDialog
            bill={duplicatingBill}
            isOpen={!!duplicatingBill}
            onClose={() => setDuplicatingBill(null)}
            onDuplicate={handleDuplicate}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default Index;