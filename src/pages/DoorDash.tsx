import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { ActiveSessionCard } from '@/components/ActiveSessionCard';
import { DashSessionsTable } from '@/components/DashSessionsTable';
import { DashStatsCards } from '@/components/DashStatsCards';
import { useDashSessions } from '@/hooks/useDashSessions';
import { useDashExpenses } from '@/hooks/useDashExpenses';
import { Play } from 'lucide-react';

const DoorDash = () => {
  const { 
    sessions, 
    activeSessions, 
    isLoading, 
    startSession, 
    endSession, 
    updateSession, 
    deleteSession 
  } = useDashSessions();
  
  const { expenses } = useDashExpenses();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">DoorDash Tracker</h1>
          {activeSessions.length === 0 && (
            <Button onClick={startSession}>
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          )}
        </div>

        <DashStatsCards sessions={sessions} expenses={expenses} />

        {activeSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Sessions</h2>
            {activeSessions.map((session) => (
              <ActiveSessionCard
                key={session.id}
                session={session}
                onEndSession={endSession}
                onUpdateSession={updateSession}
              />
            ))}
          </div>
        )}

        <DashSessionsTable 
          sessions={sessions} 
          onDeleteSession={deleteSession}
        />
      </main>
    </div>
  );
};

export default DoorDash;