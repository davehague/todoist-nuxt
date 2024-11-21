import { createClient } from "@supabase/supabase-js";

// The key is safe to use in a browser if you have enabled Row Level Security
// for your tables and configured policies.
// (via https://supabase.com/dashboard/project/gdyjsqmpybjcsrevmlmq/settings/api)
const supabaseUrl = "https://gdyjsqmpybjcsrevmlmq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkeWpzcW1weWJqY3NyZXZtbG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIwNzM3ODgsImV4cCI6MjAyNzY0OTc4OH0.yC4m1AhTPt8YazqdW3cv3tpDme9UlDqZ2qyzSIhTBG8";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: "todoist" },
});
