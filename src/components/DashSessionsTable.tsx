import { useState } from 'react';
import { DashSession } from '@/types/dash';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Edit, Trash2, Clock, DollarSign } from 'lucide-react';

interface DashSessionsTableProps {
  sessions: DashSession[];
  onDeleteSession: (sessionId: string) => void;
}

export const DashSessionsTable = ({ sessions, onDeleteSession }: DashSessionsTableProps) => {
  const formatDuration = (hours: number | null | undefined) => {
    if (!hours) return 'Active';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateHourlyRate = (session: DashSession) => {
    if (!session.total_hours || session.total_hours === 0) return 0;
    return session.total_earnings / session.total_hours;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sessions recorded yet. Start your first session!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Deliveries</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Hourly Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {format(new Date(session.start_time), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{formatDuration(session.total_hours)}</TableCell>
                    <TableCell>{session.total_deliveries}</TableCell>
                    <TableCell>{formatCurrency(session.total_earnings)}</TableCell>
                    <TableCell>
                      {session.total_hours 
                        ? formatCurrency(calculateHourlyRate(session))
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {session.end_time ? (
                        <Badge variant="secondary">Completed</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteSession(session.id)}
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
        )}
      </CardContent>
    </Card>
  );
};