// plugins/supabase-auth.client.ts
import { supabase } from "@/utils/supabaseClient";

export default defineNuxtPlugin(async () => {
  const exchangeGoogleToken = async (credential: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: credential,
    });
    if (error) throw error;
    return data;
  };

  return {
    provide: {
      supabaseAuth: {
        exchangeGoogleToken,
      },
    },
  };
});
