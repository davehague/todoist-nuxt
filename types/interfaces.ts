export interface Task {
  id: string;
  content: string;
  project_name: string;
  project_id: string;
  section_id: string;
  section_name: string;
  due?: {
    date: string;
    is_recurring: boolean;
    string: string;
  };
  description: string;
  priority: number;
  created_at: string;
  is_completed: boolean;
  completed_at?: string;
  labels: string[];
  url: string;
}

export interface CompletedTask {
  completed_at: string;
  content: string;
  id: string;
  task_id: string;
  project_id: string;
  section_id: string | null;
  v2_project_id: string;
  v2_section_id: string | null;
  v2_task_id: string;
  user_id: string;
  item_object: any | null;
  meta_data: any | null;
  note_count: number;
  notes: any[];
}

export interface RawTask {
  id: string;
  content: string;
  project_id: string;
  section_id: string;
  due?: {
    date: string;
    is_recurring: boolean;
    string: string;
  };
  description: string;
  priority: number;
  created_at: string;
  is_completed: boolean;
  labels: string[];
  url: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  name: string;
}

export interface Due {
  date: string;
  string: string;
  lang: string;
  recurring: boolean;
  datetime?: string;
  timezone?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
