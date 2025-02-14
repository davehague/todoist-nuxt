import { type Task } from "@/types/interfaces";
import { isToday } from "date-fns";

export function getTaskStatus(task: Task): "overdue" | "today" | "none" {
  if (!task.due?.date) return "none";
  const taskDate = new Date(task.due.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (taskDate < today) return "overdue";
  if (isToday(taskDate)) return "today";
  return "none";
}

export function getPriorityIndicator(priority: number): string {
  return priority > 1 ? "!".repeat(priority - 1) : "";
}

// Remove or comment out PRIORITY_COLORS as it's no longer needed
// export const PRIORITY_COLORS = { ... };
