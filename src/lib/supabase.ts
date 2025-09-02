import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url) {
  throw new Error("VITE_SUPABASE_URL is not set");
}

if (!key) {
  throw new Error("VITE_SUPABASE_ANON_KEY is not set");
}

export const supabase = createClient(url, key, { auth: { persistSession: false } });
