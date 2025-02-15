import { TodoistService } from "~/server/services/TodoistService";

export default defineEventHandler(async (event) => {
  return TodoistService.makeRequest(
    "/rest/v2/projects",
    { method: "GET" },
    event
  );
});
