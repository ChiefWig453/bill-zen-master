import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBillTemplatesSecure } from "@/hooks/useBillTemplatesSecure";
import { useCategories } from "@/hooks/useCategories";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(255, "Name must be less than 255 characters"),
  amount: z.number().min(0, "Amount must be positive").max(999999.99, "Amount too large").optional(),
  category: z.string().trim().min(1, "Category is required").max(100, "Category must be less than 100 characters"),
  due_day: z.number().min(1, "Due day must be between 1-31").max(31, "Due day must be between 1-31").optional(),
});

const categorySchema = z.string().trim().min(1, "Category name is required").max(100, "Category name must be less than 100 characters");

interface AddTemplateFormProps {
  onCancel: () => void;
}

export const AddTemplateForm = ({ onCancel }: AddTemplateFormProps) => {
  const [templateName, setTemplateName] = useState("");
  const [templateAmount, setTemplateAmount] = useState("");
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateDueDay, setTemplateDueDay] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  const { addTemplate } = useBillTemplatesSecure();
  const { allCategories, addCustomCategory } = useCategories();
  const { toast } = useToast();

  const resetForm = () => {
    setTemplateName("");
    setTemplateAmount("");
    setTemplateCategory("");
    setTemplateDueDay("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (!templateCategory) {
      toast({
        title: "Validation Error", 
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const templateData = {
        name: templateName.trim(),
        amount: templateAmount ? parseFloat(templateAmount) : undefined,
        category: templateCategory,
        due_day: templateDueDay ? parseInt(templateDueDay) : undefined,
      };

      templateSchema.parse(templateData);
      await addTemplate(templateData);
      
      toast({
        title: "Success",
        description: "Template created successfully",
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
          description: "Failed to create template",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddCustomCategory = async () => {
    try {
      categorySchema.parse(newCategory);
      await addCustomCategory(newCategory.trim());
      setTemplateCategory(newCategory.trim());
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
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Add Recurring Bill Template</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="templateName">Template Name *</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g., Electric Bill, Netflix"
            required
            maxLength={255}
          />
        </div>

        <div>
          <Label htmlFor="templateAmount">Amount (optional)</Label>
          <Input
            id="templateAmount"
            type="number"
            step="0.01"
            min="0"
            max="999999.99"
            value={templateAmount}
            onChange={(e) => setTemplateAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="templateCategory">Category *</Label>
          <div className="flex gap-2">
            <Select value={templateCategory} onValueChange={setTemplateCategory} required>
              <SelectTrigger id="templateCategory">
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
          <Label htmlFor="templateDueDay">Due Day (optional)</Label>
          <Input
            id="templateDueDay"
            type="number"
            min="1"
            max="31"
            value={templateDueDay}
            onChange={(e) => setTemplateDueDay(e.target.value)}
            placeholder="Day of month (1-31)"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button type="submit" className="w-full sm:flex-1">
            Create Template
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
