import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { INCOME_CATEGORIES, INCOME_FREQUENCIES, Income } from '@/types/income';

const incomeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount must be less than $999,999.99'),
  category: z.string().min(1, 'Category is required'),
  frequency: z.enum(['one-time', 'weekly', 'bi-weekly', 'monthly', 'annually']),
  is_recurring: z.boolean(),
  date_received: z.date().optional(),
  is_received: z.boolean(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface AddIncomeFormProps {
  onAddIncome: (income: Omit<Income, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  onCancel: () => void;
  editingIncome?: Income | null;
}

export const AddIncomeForm = ({ onAddIncome, onCancel, editingIncome }: AddIncomeFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      name: editingIncome?.name || '',
      amount: editingIncome?.amount || 0,
      category: editingIncome?.category || '',
      frequency: editingIncome?.frequency || 'monthly',
      is_recurring: editingIncome?.is_recurring || false,
      date_received: editingIncome?.date_received ? new Date(editingIncome.date_received) : undefined,
      is_received: editingIncome?.is_received || false,
    },
  });

  const watchIsRecurring = form.watch('is_recurring');
  const watchIsReceived = form.watch('is_received');

  const onSubmit = async (data: IncomeFormData) => {
    setIsLoading(true);
    try {
      await onAddIncome({
        name: data.name,
        amount: data.amount,
        category: data.category,
        frequency: data.frequency,
        is_recurring: data.is_recurring,
        is_received: data.is_received,
        date_received: data.date_received?.toISOString().split('T')[0] || null,
        next_date: null, // This will be calculated by the database trigger
      });
      
      if (!editingIncome) {
        form.reset();
      }
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className={`${editingIncome ? 'bg-primary/5' : 'bg-muted/30'}`}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${editingIncome ? 'bg-primary/10' : 'bg-green-100 dark:bg-green-900/30'}`}>
              <Plus className={`h-4 w-4 ${editingIncome ? 'text-primary' : 'text-green-600 dark:text-green-400'}`} />
            </div>
            <span>{editingIncome ? `Edit Income: ${editingIncome.name}` : 'Add New Income'}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          {editingIncome ? 
            `Update income information for ${editingIncome.name}` : 
            'Track your income sources to get a complete financial picture and better budgeting insights'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Income Source Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Salary, Freelance Project, Rental Income" 
                        {...field} 
                        autoFocus={editingIncome !== null}
                        maxLength={255}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Give your income source a descriptive name
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Amount <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="999999.99"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Enter the income amount in dollars
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select income category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-50 bg-background border shadow-md">
                        {INCOME_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category} className="cursor-pointer">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Categorize your income for better tracking
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Frequency <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How often do you receive this?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-50 bg-background border shadow-md">
                        {INCOME_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value} className="cursor-pointer">
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {field.value === 'one-time' ? 'This is a one-time payment' : `You receive this ${field.value}`}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Recurring Income
                      </FormLabel>
                      <div className="text-xs text-muted-foreground">
                        This income repeats on a regular schedule
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="ml-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_received"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Already Received
                      </FormLabel>
                      <div className="text-xs text-muted-foreground">
                        Mark if you've already received this payment
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="ml-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {watchIsReceived && (
              <div className="animate-fade-in">
                <FormField
                  control={form.control}
                  name="date_received"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-2">
                      <FormLabel className="text-sm font-medium">
                        Date Received <span className="text-destructive">*</span>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick the date you received this income</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        Select when you received this income
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingIncome ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingIncome ? 'Update Income' : 'Add Income'}
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1 sm:flex-none"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};