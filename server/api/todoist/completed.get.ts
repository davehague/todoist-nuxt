// server/api/todoist/completed.get.ts
import { TodoistService } from "@/server/services/todoist";

export default defineEventHandler(async (event) => {
  const token = await TodoistService.userBearerToken();
  const response = await fetch(
    "https://api.todoist.com/sync/v9/completed/get_all",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: "Failed to fetch completed tasks",
    });
  }

  return response.json();
});
