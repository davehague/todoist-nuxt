import { TodoistService } from "~/server/services/TodoistService";
import { TodoistTaskUpdate } from "@/types/todoist";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  console.log("Received PUT request with body:", body);

  const { id, updates } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Task ID is required",
    });
  }

  return TodoistService.updateTask(id, updates, event);
});
