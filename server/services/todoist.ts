import { H3Event, createError } from "h3";
import { decryptToken } from "@/utils/encryption";
import { supabase } from "@/utils/supabaseClient";
import { useAuthStore } from "@/stores/useAuthStore";

export class TodoistService {
  static async userBearerToken(event?: H3Event): Promise<string> {
    const authStore = useAuthStore();
    console.log("Getting the bearer token from authStore", authStore);
    if (!authStore.isAuthenticated) {
      throw createError({
        statusCode: 401,
        message: "No user session found",
      });
    }
    const userId = authStore.user.value!.id;
    const { data: userToken, error } = await supabase
      .from("user_tokens")
      .select("encrypted_token")
      .eq("user_id", userId)
      .single();
    if (error || !userToken?.encrypted_token) {
      throw createError({
        statusCode: 401,
        message: "No Todoist token found",
      });
    }
    return await decryptToken(userToken.encrypted_token);
  }

  static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    event?: H3Event
  ) {
    const token = await this.userBearerToken(event);
    const baseUrl = "https://api.todoist.com";

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

    return response.json();
  }
}
