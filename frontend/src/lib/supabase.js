import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebase";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    accessToken: async () => {
      const user = auth.currentUser;

      if (!user) {
        return null;
      }

      return await user.getIdToken();
    },
  }
);