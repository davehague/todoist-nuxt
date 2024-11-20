// server/api/todoist/sections.get.ts
import { TodoistService } from "@/server/services/todoist";

export default defineEventHandler(async (event) => {
  const token = await TodoistService.userBearerToken();
  const response = await fetch("https://api.todoist.com/rest/v2/sections", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: "Failed to fetch sections",
    });
  }

  return response.json();
});
