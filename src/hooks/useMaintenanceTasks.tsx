import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceTask, MaintenanceHistory } from "@/types/maintenance";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export const useMaintenanceTasks = (frequency?: 'weekly' | 'monthly' | 'seasonal') => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['maintenance-tasks', frequency],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (frequency) {
        query = query.eq('frequency', frequency);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MaintenanceTask[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_tasks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the task first
      const { data: task, error: taskError } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // Create history record
      const { error: historyError } = await supabase
        .from('maintenance_history')
        .insert({
          task_id: taskId,
          user_id: user.id,
          notes: notes || null,
        });

      if (historyError) throw historyError;

      // Update task with completion time
      const { error: updateError } = await supabase
        .from('maintenance_tasks')
        .update({
          last_completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      return task;
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
      const { error } = await supabase
        .from('maintenance_tasks')
        .update({ is_active: isActive })
        .eq('id', taskId);

      if (error) throw error;
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
  const { data: history, isLoading } = useQuery({
    queryKey: ['maintenance-history', taskId],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_history')
        .select('*')
        .order('completed_at', { ascending: false });

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MaintenanceHistory[];
    },
  });

  return {
    history: history || [],
    isLoading,
  };
};
