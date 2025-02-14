import { type Task } from "@/types/interfaces";

export function getTaskStatus(task: Task): "overdue" | "due" | "no-date" {
  if (!task.due?.date) return "no-date";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayString = today.toISOString().split("T")[0]; // YYYY-MM-DD

  return task.due.date < todayString ? "overdue" : "due";
}

export function getPriorityIndicator(priority: number): string {
  return priority > 1 ? "!".repeat(priority - 1) : "";
}

export function isOverdue(task: Task): boolean {
  if (!task.due?.date) return false;
  const taskDate = new Date(task.due.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return taskDate < today;
}
