import { supabase } from "@/utils/supabaseClient";
import { type User } from "@/types/interfaces";

export default class PersistentDataService {
  static async fetchUserByEmail(email: string): Promise<User | null> {
    const query = supabase.from("users").select("*").eq("email", email);
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching user by email:", error);
      throw error;
    }

    return data.length > 0 ? data[0] : null;
  }

  static async updateLastLogin(userId: string) {
    const query = supabase
      .from("users")
      .update({ last_login: new Date() })
      .eq("id", userId)
      .select();
    const { data, error } = await query;

    if (error) {
      console.error("Error updating last login:", error);
      throw error;
    }

    return data.length > 0 ? data[0] : null;
  }

  static async createUser(
    user: Omit<Partial<User>, "id" | "created_at" | "updated_at">
  ): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .insert({
        ...user,
        last_login: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async saveUserToken(
    userId: number,
    tokenData: {
      encrypted_token: string;
      token_iv: string;
      encryption_key: string;
    }
  ): Promise<void> {
    if (
      !tokenData.encrypted_token ||
      !tokenData.token_iv ||
      !tokenData.encryption_key
    ) {
      throw new Error(
        "Invalid token data: encrypted_token, token_iv, and encryption_key are required"
      );
    }

    const { error } = await supabase.from("user_tokens").upsert(
      {
        user_id: userId,
        encrypted_token: tokenData.encrypted_token,
        token_iv: tokenData.token_iv,
        encryption_key: tokenData.encryption_key,
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error("Error saving user token:", error);
      throw error;
    }
  }

  static async getUserToken(userId: number) {
    const { data, error } = await supabase
      .from("user_tokens")
      .select("encrypted_token, token_iv, encryption_key")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user token:", error);
      throw error;
    }

    return data;
  }

  static async deleteUserToken(userId: number): Promise<void> {
    const { error } = await supabase
      .from("user_tokens")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting user token:", error);
      throw error;
    }
  }
}
