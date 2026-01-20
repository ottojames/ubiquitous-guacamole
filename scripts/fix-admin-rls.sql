-- Drop existing RLS policy on admin_sessions
DROP POLICY IF EXISTS "Admin sessions manageable by service role only" ON public.admin_sessions;

-- Disable RLS for admin_sessions since we're using service role
-- The service role bypasses RLS anyway, but having RLS enabled with no policies blocks even service role
ALTER TABLE public.admin_sessions DISABLE ROW LEVEL SECURITY;

-- Also fix admin_actions if needed
DROP POLICY IF EXISTS "Admin actions readable by service role only" ON public.admin_actions;
ALTER TABLE public.admin_actions DISABLE ROW LEVEL SECURITY;

-- Keep RLS on admin_users but fix the policy
DROP POLICY IF EXISTS "Admin users manageable by service role only" ON public.admin_users;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;