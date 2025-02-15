import { TodoistService } from "~/server/services/TodoistService";

export default defineEventHandler(async (event) => {
  const taskId = event.context.params?.id;

  if (!taskId) {
    throw createError({
      statusCode: 400,
      message: "Task ID is required",
    });
  }

  const result = await TodoistService.deleteTask(taskId, event);
  if (result === true) {
    event.node.res.statusCode = 204;
    return null;
  }
  return result;
});
