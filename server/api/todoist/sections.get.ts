// server/api/todoist/sections.get.ts
import { TodoistService } from "@/server/services/todoist";

export default defineEventHandler(async (event) => {
  return TodoistService.makeRequest("/rest/v2/sections", { method: 'GET' }, event);
});
