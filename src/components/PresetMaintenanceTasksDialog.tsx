import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library, Plus } from "lucide-react";
import { presetMaintenanceTasks, PresetMaintenanceTask } from "@/data/presetMaintenanceTasks";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export const PresetMaintenanceTasksDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weeklyTasks = presetMaintenanceTasks.filter(t => t.frequency === 'weekly');
  const monthlyTasks = presetMaintenanceTasks.filter(t => t.frequency === 'monthly');
  const seasonalTasks = presetMaintenanceTasks.filter(t => t.frequency === 'seasonal');

  const toggleTask = (taskName: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskName)) {
      newSelected.delete(taskName);
    } else {
      newSelected.add(taskName);
    }
    setSelectedTasks(newSelected);
  };

  const handleAddTasks = async () => {
    if (selectedTasks.size === 0) {
      toast({
        title: "No Tasks Selected",
        description: "Please select at least one task to add.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      const tasksToAdd = presetMaintenanceTasks
        .filter(task => selectedTasks.has(task.name))
        .map(task => ({
          name: task.name,
          description: task.description,
          frequency: task.frequency,
          season: task.season || null,
          reminder_days_before: task.reminderDaysBefore,
          is_custom: false,
        }));

      // Create tasks one by one
      for (const task of tasksToAdd) {
        await apiClient.createMaintenanceTask(task);
      }

      toast({
        title: "Tasks Added",
        description: `Successfully added ${selectedTasks.size} task(s) to your maintenance schedule.`,
      });

      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      setSelectedTasks(new Set());
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tasks. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding preset tasks:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const TaskList = ({ tasks }: { tasks: PresetMaintenanceTask[] }) => (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.name}
          className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => toggleTask(task.name)}
        >
          <Checkbox
            id={task.name}
            checked={selectedTasks.has(task.name)}
            onCheckedChange={() => toggleTask(task.name)}
            className="mt-1"
          />
          <div className="flex-1 space-y-1">
            <label
              htmlFor={task.name}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {task.name}
            </label>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs capitalize">
                {task.frequency}
              </Badge>
              {task.season && (
                <Badge variant="outline" className="text-xs capitalize">
                  {task.season}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Library className="h-4 w-4 mr-2" />
          Add from Presets
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Preset Maintenance Tasks</DialogTitle>
          <DialogDescription>
            Select common home maintenance tasks to add to your schedule
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4 pr-4">
            <TabsContent value="weekly" className="mt-0">
              <TaskList tasks={weeklyTasks} />
            </TabsContent>

            <TabsContent value="monthly" className="mt-0">
              <TaskList tasks={monthlyTasks} />
            </TabsContent>

            <TabsContent value="seasonal" className="mt-0">
              <TaskList tasks={seasonalTasks} />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAddTasks} disabled={isAdding || selectedTasks.size === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Selected Tasks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
