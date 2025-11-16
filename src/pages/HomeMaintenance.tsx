import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceChecklist } from "@/components/MaintenanceChecklist";
import { AddMaintenanceTaskDialog } from "@/components/AddMaintenanceTaskDialog";
import { PresetMaintenanceTasksDialog } from "@/components/PresetMaintenanceTasksDialog";
import { useMaintenanceTasks } from "@/hooks/useMaintenanceTasks";
import { Navigation } from "@/components/Navigation";
import { Wrench } from "lucide-react";

const HomeMaintenance = () => {
  const weeklyTasks = useMaintenanceTasks('weekly');
  const monthlyTasks = useMaintenanceTasks('monthly');
  const seasonalTasks = useMaintenanceTasks('seasonal');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Home Maintenance</h1>
              <p className="text-muted-foreground">
                Keep track of your home maintenance tasks and stay on schedule
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <PresetMaintenanceTasksDialog />
            <AddMaintenanceTaskDialog />
          </div>
        </div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <MaintenanceChecklist
            tasks={weeklyTasks.tasks}
            onComplete={(taskId) => weeklyTasks.completeTask({ taskId })}
            isCompleting={weeklyTasks.isCompleting}
            title="Weekly Tasks"
            description="Tasks that should be completed every week"
          />
        </TabsContent>

        <TabsContent value="monthly">
          <MaintenanceChecklist
            tasks={monthlyTasks.tasks}
            onComplete={(taskId) => monthlyTasks.completeTask({ taskId })}
            isCompleting={monthlyTasks.isCompleting}
            title="Monthly Tasks"
            description="Tasks that should be completed every month"
          />
        </TabsContent>

        <TabsContent value="seasonal">
          <MaintenanceChecklist
            tasks={seasonalTasks.tasks}
            onComplete={(taskId) => seasonalTasks.completeTask({ taskId })}
            isCompleting={seasonalTasks.isCompleting}
            title="Seasonal Tasks"
            description="Tasks that should be completed each season"
          />
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
};

export default HomeMaintenance;
