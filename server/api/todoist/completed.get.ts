import { TodoistService } from "~/server/services/TodoistService";

export default defineEventHandler(async (event) => {
  return TodoistService.makeRequest(
    "/sync/v9/completed/get_all",
    { method: "GET" },
    event
  );
});
