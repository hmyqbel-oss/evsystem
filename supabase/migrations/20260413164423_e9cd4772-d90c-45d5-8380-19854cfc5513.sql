
-- Allow anonymous users to insert organizations (public evaluation form creates new org)
CREATE POLICY "Anyone can insert organizations"
ON public.organizations FOR INSERT TO anon, authenticated
WITH CHECK (true);
