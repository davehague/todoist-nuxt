import { TodoistService } from "@/server/services/todoist";
import { TodoistTaskUpdate } from "@/types/todoist";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, ...updateData } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Task ID is required",
    });
  }

  if (updateData.duration && !updateData.duration_unit) {
    throw createError({
      statusCode: 400,
      message: "duration_unit is required when duration is specified",
    });
  }

  if (updateData.duration_unit && !updateData.duration) {
    throw createError({
      statusCode: 400,
      message: "duration is required when duration_unit is specified",
    });
  }

  if (updateData.duration && updateData.duration <= 0) {
    throw createError({
      statusCode: 400,
      message: "duration must be a positive number",
    });
  }

  return TodoistService.updateTask(id, updateData as TodoistTaskUpdate, event);
});
