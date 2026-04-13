
-- Make evaluator_id nullable (no longer required for public evaluations)
ALTER TABLE public.evaluations ALTER COLUMN evaluator_id DROP NOT NULL;

-- Drop existing RLS policies on evaluations
DROP POLICY IF EXISTS "Authenticated users can view evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can insert own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Users can update own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Admins can delete evaluations" ON public.evaluations;

-- Allow anonymous users to insert evaluations (public form)
CREATE POLICY "Anyone can insert evaluations"
ON public.evaluations FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Allow anonymous users to update their own evaluations (by id, during session)
CREATE POLICY "Anyone can update evaluations"
ON public.evaluations FOR UPDATE TO anon, authenticated
USING (true);

-- Only admins can view all evaluations
CREATE POLICY "Admins can view evaluations"
ON public.evaluations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete evaluations
CREATE POLICY "Admins can delete evaluations"
ON public.evaluations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous users to read organizations (for the public form selector)
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON public.organizations;
CREATE POLICY "Anyone can view organizations"
ON public.organizations FOR SELECT TO anon, authenticated
USING (true);

-- Allow anonymous to update organization data during evaluation
CREATE POLICY "Anyone can update organization data"
ON public.organizations FOR UPDATE TO anon, authenticated
USING (true);
