import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { z } from "zod";

const recurringBillSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255, "Name must be less than 255 characters"),
  amount: z.number().min(0, "Amount must be positive").max(999999.99, "Amount too large").optional(),
  category: z.string().trim().min(1, "Category is required").max(100, "Category must be less than 100 characters"),
  due_day: z.number().min(1, "Due day must be between 1-31").max(31, "Due day must be between 1-31").optional(),
});

const categorySchema = z.string().trim().min(1, "Category name is required").max(100, "Category name must be less than 100 characters");

interface AddRecurringBillFormProps {
  onCancel: () => void;
  addRecurringBill: (data: any) => Promise<any>;
}

export const AddRecurringBillForm = ({ onCancel, addRecurringBill }: AddRecurringBillFormProps) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const { allCategories, addCustomCategory } = useCategories();
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setAmount("");
    setCategory("");
    setDueDay("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Validation Error", 
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const recurringBillData = {
        name: name.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        category: category,
        due_day: dueDay ? parseInt(dueDay) : undefined,
      };

      recurringBillSchema.parse(recurringBillData);
      await addRecurringBill(recurringBillData);
      
      toast({
        title: "Success",
        description: "Recurring bill created successfully",
      });
      
      resetForm();
      onCancel();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create recurring bill",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddCustomCategory = async () => {
    try {
      categorySchema.parse(newCategory);
      await addCustomCategory(newCategory.trim());
      setCategory(newCategory.trim());
      setNewCategory("");
      setShowAddCategory(false);
      toast({
        title: "Success",
        description: "Category added successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="p-4 sm:p-6 mb-4 sm:mb-6 bg-card">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Add Recurring Bill</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Electric Bill, Netflix"
            required
            maxLength={255}
          />
        </div>

        <div>
          <Label htmlFor="amount">Amount (optional)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            max="999999.99"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  + New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="newCategory">Category Name</Label>
                    <Input
                      id="newCategory"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter category name"
                      maxLength={100}
                    />
                  </div>
                  <Button onClick={handleAddCustomCategory} className="w-full">
                    Add Category
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div>
          <Label htmlFor="dueDay">Due Day (optional)</Label>
          <Input
            id="dueDay"
            type="number"
            min="1"
            max="31"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder="Day of month (1-31)"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button type="submit" className="w-full sm:flex-1">
            Create Recurring Bill
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
