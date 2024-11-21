// server/api/todoist/tasks.get.ts
import { TodoistService } from "@/server/services/todoist";

export default defineEventHandler(async (event) => {
  return TodoistService.makeRequest("/rest/v2/tasks", { method: 'GET' }, event);
});
