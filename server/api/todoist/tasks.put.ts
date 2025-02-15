import { TodoistService } from "@/server/services/todoist";
import { TodoistTaskUpdate } from "@/types/todoist";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, due, priority, ...restData } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Task ID is required",
    });
  }

  const updateData: TodoistTaskUpdate = { ...restData };

  // Handle priority update
  if (typeof priority !== "undefined") {
    updateData.priority = Number(priority);
  }

  // Handle due date updates - only using due_date
  if (due === undefined || due === null) {
    updateData.due_date = undefined;
  } else if (due?.date) {
    updateData.due_date = due.date;
  }

  // Validate duration if present
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

  return TodoistService.updateTask(id, updateData, event);
});
