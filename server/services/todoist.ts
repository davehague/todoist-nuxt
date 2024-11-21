import { H3Event, createError, getHeader } from "h3";
import { supabase } from "@/utils/supabaseClient";
import { decryptToken } from "@/utils/encryption";
import { requireUserSession } from "../utils/auth";

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

    const { data: userToken, error } = await supabase
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
}
