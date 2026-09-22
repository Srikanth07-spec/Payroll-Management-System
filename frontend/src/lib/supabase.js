import { createClient } from "@supabase/supabase-js";

// Simple anon client — no Firebase auth required
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
