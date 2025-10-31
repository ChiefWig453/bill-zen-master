import { useState } from 'react';
import { Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BillTemplate } from '@/hooks/useBillTemplatesSecure';

interface TemplatesTableProps {
  templates: BillTemplate[];
  onEdit: (template: BillTemplate) => void;
  onDelete: (id: string) => void;
}

const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

export const TemplatesTable = ({ templates, onEdit, onDelete }: TemplatesTableProps) => {
  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="rounded-full bg-muted p-6">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-semibold">No recurring bills yet</h3>
            <p className="text-muted-foreground">
              Create your first recurring bill template to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recurring Bills ({templates.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Template</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold text-center">Due Date</TableHead>
                <TableHead className="font-semibold text-center w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} className="hover:bg-muted/30">
                  <TableCell className="py-4">
                    <div className="font-medium">{template.name}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="font-normal">
                      {template.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right font-mono">
                    {template.amount ? (
                      <span className="font-semibold">
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
                        variant="ghost"
                        onClick={() => onEdit(template)}
                        title={`Edit ${template.name}`}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete "${template.name}"?`)) {
                            onDelete(template.id);
                          }
                        }}
                        title={`Delete ${template.name}`}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};