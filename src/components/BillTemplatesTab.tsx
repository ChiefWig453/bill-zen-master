import { useState } from 'react';
import { Plus, Edit, Trash2, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BillTemplate } from '@/types/billTemplate';
import { useBillTemplates } from '@/hooks/useBillTemplates';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';

interface BillTemplatesTabProps {
  onCreateBillFromTemplate: (template: BillTemplate) => void;
}

export const BillTemplatesTab = ({ onCreateBillFromTemplate }: BillTemplatesTabProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BillTemplate | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    description: ''
  });
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useBillTemplates();
  const { toast } = useToast();
  const { allCategories, addCustomCategory } = useCategories();

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      description: ''
    });
    setEditingTemplate(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Name and category are required.",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      name: formData.name,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      category: formData.category,
      description: formData.description || undefined
    };

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateData);
    } else {
      addTemplate(templateData);
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleEdit = (template: BillTemplate) => {
    setFormData({
      name: template.name,
      amount: template.amount?.toString() || '',
      category: template.category,
      description: template.description || ''
    });
    setEditingTemplate(template);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowAddForm(false);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bill Templates</h2>
          <p className="text-muted-foreground">
            Create reusable bill templates for easy bill management
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Template
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {editingTemplate ? 'Edit Template' : 'Add New Template'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    placeholder="e.g., Monthly Electric Bill"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="templateCategory">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Add new category */}
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add new category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCategory.trim() && addCustomCategory(newCategory)) {
                            setFormData(prev => ({ ...prev, category: newCategory.trim() }));
                            setNewCategory('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newCategory.trim() && addCustomCategory(newCategory)) {
                          setFormData(prev => ({ ...prev, category: newCategory.trim() }));
                          setNewCategory('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="templateAmount">Default Amount (Optional)</Label>
                  <Input
                    id="templateAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description (Optional)</Label>
                <Textarea
                  id="templateDescription"
                  placeholder="Add any notes about this bill template..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTemplate ? 'Update Template' : 'Add Template'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Templates ({templates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Default Amount</TableHead>
                    <TableHead>Description</TableHead>
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
                      <TableCell className="max-w-xs truncate">
                        {template.description || '—'}
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Templates:</span>
                    <span className="font-medium">{templates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Templates with Amount:</span>
                    <span className="font-medium">{templates.filter(t => t.amount).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      ${templates.reduce((sum, template) => sum + (template.amount || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bill template to get started
              </p>
              <Button onClick={() => setShowAddForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};