// server/api/todoist/completed.get.ts
import { TodoistService } from "@/server/services/todoist";

export default defineEventHandler(async (event) => {
  return TodoistService.makeRequest("/sync/v9/completed/get_all", { method: 'GET' }, event);
});
