import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DashSession } from '@/types/dash';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

interface AddDashSessionDialogProps {
  onAddSession: (session: Omit<DashSession, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'total_hours'>) => void;
}

export const AddDashSessionDialog = ({ onAddSession }: AddDashSessionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    total_earnings: '',
    total_deliveries: '',
    miles_driven: '',
    gas_cost: '',
    tips_cash: '',
    tips_app: '',
    base_pay: '',
    promotions: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      total_earnings: parseFloat(formData.total_earnings) || 0,
      total_deliveries: parseInt(formData.total_deliveries) || 0,
      miles_driven: formData.miles_driven ? parseFloat(formData.miles_driven) : undefined,
      gas_cost: formData.gas_cost ? parseFloat(formData.gas_cost) : undefined,
      tips_cash: parseFloat(formData.tips_cash) || 0,
      tips_app: parseFloat(formData.tips_app) || 0,
      base_pay: parseFloat(formData.base_pay) || 0,
      promotions: parseFloat(formData.promotions) || 0,
      notes: formData.notes || undefined
    };

    onAddSession(sessionData);
    setOpen(false);
    
    // Reset form
    setFormData({
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      total_earnings: '',
      total_deliveries: '',
      miles_driven: '',
      gas_cost: '',
      tips_cash: '',
      tips_app: '',
      base_pay: '',
      promotions: '',
      notes: ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Past Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Past DoorDash Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total-earnings">Total Earnings ($)</Label>
              <Input
                id="total-earnings"
                type="number"
                step="0.01"
                value={formData.total_earnings}
                onChange={(e) => handleInputChange('total_earnings', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="total-deliveries">Total Deliveries</Label>
              <Input
                id="total-deliveries"
                type="number"
                value={formData.total_deliveries}
                onChange={(e) => handleInputChange('total_deliveries', e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base-pay">Base Pay ($)</Label>
              <Input
                id="base-pay"
                type="number"
                step="0.01"
                value={formData.base_pay}
                onChange={(e) => handleInputChange('base_pay', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="promotions">Promotions ($)</Label>
              <Input
                id="promotions"
                type="number"
                step="0.01"
                value={formData.promotions}
                onChange={(e) => handleInputChange('promotions', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tips-cash">Cash Tips ($)</Label>
              <Input
                id="tips-cash"
                type="number"
                step="0.01"
                value={formData.tips_cash}
                onChange={(e) => handleInputChange('tips_cash', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="tips-app">App Tips ($)</Label>
              <Input
                id="tips-app"
                type="number"
                step="0.01"
                value={formData.tips_app}
                onChange={(e) => handleInputChange('tips_app', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="miles-driven">Miles Driven</Label>
              <Input
                id="miles-driven"
                type="number"
                step="0.1"
                value={formData.miles_driven}
                onChange={(e) => handleInputChange('miles_driven', e.target.value)}
                placeholder="0.0"
              />
            </div>
            <div>
              <Label htmlFor="gas-cost">Gas Cost ($)</Label>
              <Input
                id="gas-cost"
                type="number"
                step="0.01"
                value={formData.gas_cost}
                onChange={(e) => handleInputChange('gas_cost', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about this session..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};