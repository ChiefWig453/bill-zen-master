import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashSession } from '@/types/dash';
import { Clock, DollarSign, Package, Square } from 'lucide-react';

interface ActiveSessionCardProps {
  session: DashSession;
  onEndSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, updates: Partial<DashSession>) => void;
}

export const ActiveSessionCard = ({ session, onEndSession, onUpdateSession }: ActiveSessionCardProps) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [formData, setFormData] = useState({
    total_earnings: session.total_earnings.toString(),
    total_deliveries: session.total_deliveries.toString(),
    tips_cash: session.tips_cash.toString(),
    tips_app: session.tips_app.toString(),
    miles_driven: session.miles_driven?.toString() || '',
    gas_cost: session.gas_cost?.toString() || ''
  });

  useEffect(() => {
    const updateElapsedTime = () => {
      const start = new Date(session.start_time);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);
    
    return () => clearInterval(interval);
  }, [session.start_time]);

  const handleUpdateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    const numericValue = parseFloat(value) || 0;
    const updates: Partial<DashSession> = {
      [field]: field === 'total_deliveries' ? parseInt(value) || 0 : numericValue
    };
    
    onUpdateSession(session.id, updates);
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Active Session
          </div>
          <div className="text-2xl font-mono text-primary">{elapsedTime}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="earnings">Total Earnings ($)</Label>
            <Input
              id="earnings"
              type="number"
              step="0.01"
              value={formData.total_earnings}
              onChange={(e) => handleUpdateField('total_earnings', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="deliveries">Deliveries</Label>
            <Input
              id="deliveries"
              type="number"
              value={formData.total_deliveries}
              onChange={(e) => handleUpdateField('total_deliveries', e.target.value)}
              className="mt-1"
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
              onChange={(e) => handleUpdateField('tips_cash', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="tips-app">App Tips ($)</Label>
            <Input
              id="tips-app"
              type="number"
              step="0.01"
              value={formData.tips_app}
              onChange={(e) => handleUpdateField('tips_app', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="miles">Miles Driven</Label>
            <Input
              id="miles"
              type="number"
              step="0.1"
              value={formData.miles_driven}
              onChange={(e) => handleUpdateField('miles_driven', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="gas">Gas Cost ($)</Label>
            <Input
              id="gas"
              type="number"
              step="0.01"
              value={formData.gas_cost}
              onChange={(e) => handleUpdateField('gas_cost', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button 
          onClick={() => onEndSession(session.id)}
          className="w-full"
          variant="outline"
        >
          <Square className="h-4 w-4 mr-2" />
          End Session
        </Button>
      </CardContent>
    </Card>
  );
};