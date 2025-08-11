import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client used across the app.
 *
 * Environment variables:
 *   VITE_SUPABASE_URL        - your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY   - anon public key
 *
 * Place these in a `.env` file in the project root (e.g. `.env.local`).
 *
 * To run the project locally:
 *   npm install
 *   npm run dev
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
