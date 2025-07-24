import { useState } from 'react';
import { useBillTemplatesSecure, BillTemplate } from '@/hooks/useBillTemplatesSecure';
import { Plus, Edit, Trash2, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';

interface BillTemplatesTabProps {
  onCreateBillFromTemplate: (template: BillTemplate) => void;
}

export const BillTemplatesTab = ({ onCreateBillFromTemplate }: BillTemplatesTabProps) => {
  const [templateName, setTemplateName] = useState('');
  const [templateAmount, setTemplateAmount] = useState<number | undefined>();
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDueDay, setTemplateDueDay] = useState<number | undefined>();
  const [editingTemplate, setEditingTemplate] = useState<BillTemplate | null>(null);
  
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } = useBillTemplatesSecure();
  const { toast } = useToast();
  const { allCategories } = useCategories();

  const resetForm = () => {
    setTemplateName('');
    setTemplateAmount(undefined);
    setTemplateCategory('');
    setTemplateDueDay(undefined);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!templateName?.trim() || !templateCategory?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      name: templateName.trim(),
      amount: templateAmount || undefined,
      category: templateCategory.trim(),
      due_day: templateDueDay || undefined
    };

    let success = false;
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, templateData);
      setEditingTemplate(null);
      success = true;
    } else {
      const result = await addTemplate(templateData);
      success = result !== null;
    }

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (template: BillTemplate) => {
    setTemplateName(template.name);
    setTemplateAmount(template.amount);
    setTemplateCategory(template.category);
    setTemplateDueDay(template.due_day);
    setEditingTemplate(template);
  };

  const handleCreateBill = (template: BillTemplate) => {
    onCreateBillFromTemplate(template);
    toast({
      title: "Bill created",
      description: `Creating new bill from ${template.name} template.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bill Templates</h2>
          <p className="text-muted-foreground">
            Create reusable bill templates for easy bill management
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {editingTemplate ? 'Edit Template' : 'Add New Template'}
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Electricity Bill"
                  maxLength={255}
                  required
                />
              </div>
              <div>
                <Label htmlFor="templateAmount">Amount</Label>
                <Input
                  id="templateAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  value={templateAmount}
                  onChange={(e) => setTemplateAmount(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateCategory">Category *</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="templateDueDay">Due Day (1-31)</Label>
                <Input
                  id="templateDueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={templateDueDay}
                  onChange={(e) => setTemplateDueDay(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Day of month"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {editingTemplate ? 'Update Template' : 'Add Template'}
              </Button>
              {editingTemplate && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingTemplate(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bill template to get started
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Day</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {template.amount ? `$${template.amount.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>
                        {template.due_day ? `${template.due_day}` : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleCreateBill(template)}
                            className="gap-1"
                          >
                            <Calendar className="h-3 w-3" />
                            Create Bill
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteTemplate(template.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Summary Information */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Total Templates:</span>
                    <span className="font-medium">{templates.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Templates with Amount:</span>
                    <span className="font-medium">{templates.filter(t => t.amount).length}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      ${templates.reduce((sum, template) => sum + (template.amount || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  );
};