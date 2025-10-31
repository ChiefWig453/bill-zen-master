import { useState } from 'react';
import { format } from 'date-fns';
import { Receipt, Plus, Check, DollarSign, TrendingUp, CalendarDays as IncomeCalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { AddTemplateForm } from '@/components/AddTemplateForm';
import { TemplatesTable } from '@/components/TemplatesTable';
import { Navigation } from '@/components/Navigation';
import { BillTemplate } from '@/types/billTemplate';
import { AddIncomeForm } from '@/components/AddIncomeForm';
import { IncomeTable } from '@/components/IncomeTable';
import { useIncomes } from '@/hooks/useIncomes';
import { Income, INCOME_CATEGORIES } from '@/types/income';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useBillTemplatesSecure } from '@/hooks/useBillTemplatesSecure';

const Index = () => {
  const [editingTemplate, setEditingTemplate] = useState<BillTemplate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Income state
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false);
  const [incomeFilter, setIncomeFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } = useBillTemplatesSecure();
  const { incomes, isLoading: isLoadingIncomes, addIncome, updateIncome, deleteIncome, markIncomeReceived } = useIncomes();

  // Template handlers
  const handleAddTemplate = async (templateData: Omit<BillTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await addTemplate(templateData);
    if (result) {
      setShowAddForm(false);
      setEditingTemplate(null);
    }
    return result;
  };

  const handleEditTemplate = (template: BillTemplate) => {
    setEditingTemplate(template);
    setShowAddForm(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
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

          {/* Controls */}
          <div className="flex items-center justify-end">
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
                  if (editingTemplate) setEditingTemplate(null);
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
            <AddTemplateForm
              onAddTemplate={handleAddTemplate}
              editingTemplate={editingTemplate}
              onCancelEdit={() => {
                setEditingTemplate(null);
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
              <TabsTrigger value="bills">Recurring Bills</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>

            <TabsContent value="bills">
              <TemplatesTable
                templates={templates}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
              />
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
       </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;