import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url) {
  throw new Error("Missing VITE_SUPABASE_URL");
}

if (!key) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, key, { auth: { persistSession: true, storageKey: 'civic-notices-auth' } });
