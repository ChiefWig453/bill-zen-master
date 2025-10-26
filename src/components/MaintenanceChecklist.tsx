import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MaintenanceTask } from "@/types/maintenance";
import { format } from "date-fns";
import { Clock } from "lucide-react";

interface MaintenanceChecklistProps {
  tasks: MaintenanceTask[];
  onComplete: (taskId: string) => void;
  isCompleting: boolean;
  title: string;
  description: string;
}

export const MaintenanceChecklist = ({
  tasks,
  onComplete,
  isCompleting,
  title,
  description,
}: MaintenanceChecklistProps) => {
  const isOverdue = (task: MaintenanceTask) => {
    if (!task.next_due_date) return false;
    return new Date(task.next_due_date) < new Date();
  };

  const isTaskComplete = (task: MaintenanceTask) => {
    if (!task.last_completed_at || !task.next_due_date) return false;
    const dueDate = new Date(task.next_due_date);
    const weekBeforeDue = new Date(dueDate);
    weekBeforeDue.setDate(dueDate.getDate() - 7);
    return new Date(task.last_completed_at) > weekBeforeDue;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tasks available for this frequency.
            </p>
          ) : (
            tasks.map((task) => {
              const complete = isTaskComplete(task);
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={task.id}
                    checked={complete}
                    onCheckedChange={() => !complete && onComplete(task.id)}
                    disabled={isCompleting || complete}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <label
                      htmlFor={task.id}
                      className={`text-sm font-medium leading-none cursor-pointer ${
                        complete ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.name}
                    </label>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.season && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {task.season}
                        </Badge>
                      )}
                      {task.last_completed_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last: {format(new Date(task.last_completed_at), "MMM d, yyyy")}
                        </div>
                      )}
                      {task.next_due_date && (
                        <div className={`flex items-center gap-1 text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                          Next: {format(new Date(task.next_due_date), "MMM d, yyyy")}
                        </div>
                      )}
                      {overdue && !complete && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
