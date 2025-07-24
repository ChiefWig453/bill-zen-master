import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Receipt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BillCard } from '@/components/BillCard';
import { AddBillForm } from '@/components/AddBillForm';
import { BillStats } from '@/components/BillStats';
import { NotificationBanner } from '@/components/NotificationBanner';
import { Navigation } from '@/components/Navigation';
import { Bill } from '@/types/bill';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
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

  const duplicateBill = (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...billData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setBills(prev => [...prev, newBill]);
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

  // Sort bills by due date (overdue first, then by date)
  const sortedBills = [...filteredBills].sort((a, b) => {
    const aDate = new Date(a.dueDate);
    const bDate = new Date(b.dueDate);
    const today = new Date();
    
    const aOverdue = !a.isPaid && aDate < today;
    const bOverdue = !b.isPaid && bDate < today;
    
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    
    return aDate.getTime() - bDate.getTime();
  });

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

        {/* Bills Grid */}
        {sortedBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onTogglePaid={togglePaid}
                onEdit={editBill}
                onDelete={deleteBill}
                onDuplicate={duplicateBill}
              />
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
        </div>
      </div>
    </div>
  );
};

export default Index;