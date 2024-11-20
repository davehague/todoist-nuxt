// server/api/todoist/tasks.get.ts
import { TodoistService } from "@/server/services/todoist";

export default defineEventHandler(async (event) => {
  const token = await TodoistService.userBearerToken();
  const response = await fetch("https://api.todoist.com/rest/v2/tasks", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: "Failed to fetch tasks",
    });
  }

  return response.json();
});
