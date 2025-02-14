import { H3Event, createError, getHeader } from "h3";
import { serverSupabase } from "../utils/serverSupabaseClient";
import { decryptToken } from "@/utils/encryption";
import { requireUserSession } from "../utils/auth";
import { TodoistTaskUpdate } from "@/types/todoist";

export class TodoistService {
  static async userBearerToken(event?: H3Event): Promise<string> {
    if (!event) {
      throw createError({
        statusCode: 401,
        message: "No event context found",
      });
    }

    await requireUserSession(event);

    const userId = getHeader(event, "x-user-id");
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: "No user ID found",
      });
    }

    const { data: userToken, error } = await serverSupabase
      .from("user_tokens")
      .select("encrypted_token, token_iv, encryption_key")
      .eq("user_id", userId)
      .single();

    if (
      error ||
      !userToken?.encrypted_token ||
      !userToken?.token_iv ||
      !userToken?.encryption_key
    ) {
      throw createError({
        statusCode: 401,
        message: "No valid Todoist token found",
      });
    }

    try {
      const decryptedToken = await decryptToken(
        {
          encrypted_token: userToken.encrypted_token,
          token_iv: userToken.token_iv,
        },
        userToken.encryption_key
      );

      if (!decryptedToken) {
        throw new Error("Failed to decrypt token");
      }
      return decryptedToken;
    } catch (error) {
      throw createError({
        statusCode: 500,
        message: "Failed to decrypt Todoist token",
      });
    }
  }

  static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    event?: H3Event
  ) {
    const token = await this.userBearerToken(event);
    const baseUrl = "https://api.todoist.com";

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          message: `Todoist API error: ${response.statusText}`,
        });
      }

      const responseData = await response.json();
      return responseData;
    } catch (error: any) {
      console.error("Todoist API error:", error);
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || "Failed to make Todoist API request",
      });
    }
  }

  static async updateTask(
    taskId: string,
    updateData: TodoistTaskUpdate,
    event: H3Event
  ) {
    // Validate that only one due_* field is present
    const dueFields = ["due_string", "due_date", "due_datetime"];
    const presentDueFields = dueFields.filter((field) => field in updateData);
    if (presentDueFields.length > 1) {
      throw createError({
        statusCode: 400,
        message: "Only one due_* field can be used at a time",
      });
    }

    return this.makeRequest(
      `/rest/v2/tasks/${taskId}`,
      {
        method: "POST",
        body: JSON.stringify(updateData),
        headers: {
          "X-Request-Id": crypto.randomUUID(),
        },
      },
      event
    );
  }
}
