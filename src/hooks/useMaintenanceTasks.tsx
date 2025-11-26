import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from '@/lib/apiClient';
import { MaintenanceTask, MaintenanceHistory } from "@/types/maintenance";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useMaintenanceTasks = (frequency?: 'weekly' | 'monthly' | 'seasonal') => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['maintenance-tasks', frequency],
    queryFn: async () => {
      const result = await apiClient.getMaintenanceTasks(frequency);
      if (result.error) throw new Error(result.error);
      return (result.data as MaintenanceTask[]) || [];
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      // Create history record
      const historyResult = await apiClient.createMaintenanceHistory({
        task_id: taskId,
        notes: notes || null,
        completed_at: new Date().toISOString(),
      });
      if (historyResult.error) throw new Error(historyResult.error);

      // Update task with completion time
      const taskResult = await apiClient.updateMaintenanceTask(taskId, {
        last_completed_at: new Date().toISOString(),
      });
      if (taskResult.error) throw new Error(taskResult.error);

      return taskResult.data as MaintenanceTask;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-history'] });
      toast({
        title: "Task Completed",
        description: `${task.name} has been marked as complete.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
      console.error("Error completing task:", error);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, isActive }: { taskId: string; isActive: boolean }) => {
      const result = await apiClient.updateMaintenanceTask(taskId, { is_active: isActive });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating task:", error);
    },
  });

  return {
    tasks: tasks || [],
    isLoading,
    error,
    completeTask: completeTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    isCompleting: completeTaskMutation.isPending,
  };
};

export const useMaintenanceHistory = (taskId?: string) => {
  const { user } = useAuth();

  const { data: history, isLoading } = useQuery({
    queryKey: ['maintenance-history', taskId],
    queryFn: async () => {
      const result = await apiClient.getMaintenanceHistory(taskId);
      if (result.error) throw new Error(result.error);
      return (result.data as MaintenanceHistory[]) || [];
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  return {
    history: history || [],
    isLoading,
  };
};
