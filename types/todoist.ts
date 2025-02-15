export interface TodoistTaskUpdate {
  content?: string;
  description?: string;
  labels?: string[];
  priority?: number;
  due_string?: string;
  due_date?: string;
  due_datetime?: string;
  due_lang?: string;
  assignee_id?: string | null;
  duration?: number | null;
  duration_unit?: "minute" | "day" | null;
  deadline_date?: string;
  deadline_lang?: string;
}
