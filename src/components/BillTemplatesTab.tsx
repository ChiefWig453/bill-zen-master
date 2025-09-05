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

// Helper function for ordinal suffixes
const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

interface BillTemplatesTabProps {
  onCreateBillFromTemplate: (template: BillTemplate) => void | Promise<void>;
}

export const BillTemplatesTab = ({ onCreateBillFromTemplate }: BillTemplatesTabProps) => {
  const [templateName, setTemplateName] = useState('');
  const [templateAmount, setTemplateAmount] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateDueDay, setTemplateDueDay] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<BillTemplate | null>(null);
  
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } = useBillTemplatesSecure();
  const { toast } = useToast();
  const { allCategories } = useCategories();

  const resetForm = () => {
    setTemplateName('');
    setTemplateAmount('');
    setTemplateCategory('');
    setTemplateDueDay('');
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
      amount: templateAmount ? parseFloat(templateAmount) : undefined,
      category: templateCategory.trim(),
      due_day: templateDueDay ? parseInt(templateDueDay) : undefined
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
    setTemplateAmount(template.amount?.toString() || '');
    setTemplateCategory(template.category);
    setTemplateDueDay(template.due_day?.toString() || '');
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
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Bill Templates</h2>
          <p className="text-muted-foreground">
            Save time by creating reusable templates. Quick-create bills with pre-filled information or use as starting points for new bills.
          </p>
          {templates.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <FileText className="h-4 w-4" />
                {templates.length} template{templates.length !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {templates.filter(t => t.amount).length} ready for quick-create
              </span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${editingTemplate ? 'text-primary' : ''}`}>
            <FileText className="h-5 w-5" />
            {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Add New Template'}
          </CardTitle>
          {editingTemplate && (
            <p className="text-sm text-muted-foreground">
              Editing template created on {new Date(editingTemplate.created_at).toLocaleDateString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-6">
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="templateName" className="text-sm font-medium">
                  Template Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="templateName"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Electricity Bill, Monthly Rent"
                  maxLength={255}
                  required
                  autoFocus={editingTemplate !== null}
                  className={`${templateName.trim() === '' && editingTemplate ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  Give your template a descriptive name for easy identification
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateAmount" className="text-sm font-medium">
                  Default Amount <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  {templateAmount ? 'Ready for quick bill creation' : 'Leave empty to set amount when creating bill'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="templateCategory" className="text-sm font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory} required>
                  <SelectTrigger className={`${!templateCategory.trim() && editingTemplate ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background border shadow-md">
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category} className="cursor-pointer">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the bill category for organization
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="templateDueDay" className="text-sm font-medium">
                  Due Day <span className="text-xs text-muted-foreground">(1-31, optional)</span>
                </Label>
                <Input
                  id="templateDueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={templateDueDay}
                  onChange={(e) => setTemplateDueDay(e.target.value)}
                  placeholder="e.g., 15 for 15th of month"
                />
                <p className="text-xs text-muted-foreground">
                  {templateDueDay ? `Bills will be due on the ${templateDueDay}${getOrdinalSuffix(parseInt(templateDueDay))} of each month` : 'Auto-schedule bills for specific day of month'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isLoading || !templateName.trim() || !templateCategory.trim()}
                className={`flex-1 sm:flex-none ${editingTemplate ? 'bg-primary hover:bg-primary/90' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingTemplate ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingTemplate ? 'Update Template' : 'Add Template'}
                  </>
                )}
              </Button>
              
              {editingTemplate && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    toast({
                      title: "Edit cancelled",
                      description: "Template editing has been cancelled.",
                    });
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Cancel Edit
                </Button>
              )}
              
              {!editingTemplate && templates.length > 0 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => resetForm()}
                  className="flex-1 sm:flex-none"
                >
                  Clear Form
                </Button>
              )}
            </div>
          </form>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <FileText className="h-6 w-6 absolute top-3 left-3 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium">Loading templates...</h3>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your templates</p>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="rounded-full bg-muted p-6">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2 max-w-md">
                <h3 className="text-lg font-semibold">No templates yet</h3>
                <p className="text-muted-foreground">
                  Templates save you time by pre-filling bill information. Create your first template above to get started with faster bill management.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Fill out the form above
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Quick-create bills later
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Template</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-center">Due Day</TableHead>
                      <TableHead className="font-semibold text-center w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id} className="hover:bg-muted/30">
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Created {new Date(template.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="font-normal">
                            {template.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-right font-mono">
                          {template.amount ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold">
                              ${template.amount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          {template.due_day ? (
                            <Badge variant="secondary" className="font-mono">
                              {template.due_day}{getOrdinalSuffix(template.due_day)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              size="sm" 
                              variant={template.amount ? "default" : "outline"}
                              onClick={() => handleCreateBill(template)}
                              className="gap-1 text-xs px-2 py-1 h-7"
                              disabled={template.amount == null}
                              title={template.amount == null ? 'Add an amount to enable quick create' : `Create bill for ${template.name}`}
                            >
                              <Calendar className="h-3 w-3" />
                              {template.amount ? 'Quick Create' : 'Need Amount'}
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEdit(template)}
                              title={`Edit ${template.name} template`}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the "${template.name}" template? This action cannot be undone.`)) {
                                  deleteTemplate(template.id);
                                }
                              }}
                              title={`Delete ${template.name} template`}
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
              
              {/* Enhanced Summary Information */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Total Templates</span>
                    </div>
                    <div className="text-2xl font-bold">{templates.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {templates.length === 0 ? 'Create your first template' : 'Saved templates ready to use'}
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Quick-Create Ready</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {templates.filter(t => t.amount).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {templates.filter(t => t.amount).length === 0 ? 'Add amounts to enable' : 'Templates with preset amounts'}
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="h-4 w-4 rounded-full p-0" />
                      <span className="text-sm font-medium">Monthly Estimate</span>
                    </div>
                    <div className="text-2xl font-bold">
                      ${templates.reduce((sum, template) => sum + (template.amount || 0), 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From templates with amounts set
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Categories Used</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {new Set(templates.map(t => t.category)).size}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Set(templates.map(t => t.category)).size === 0 ? 'No categories yet' : 'Unique bill categories'}
                    </p>
                  </div>
                </div>
                
                {templates.length > 0 && (
                  <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pro Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                        <span>Templates with amounts enable one-click bill creation</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                        <span>Set due days to auto-schedule recurring bills</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                        <span>Edit templates anytime to update future bills</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                        <span>Use consistent categories for better tracking</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        </CardContent>
      </Card>
    </div>
  );
};