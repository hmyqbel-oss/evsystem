
-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  visit_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can view all evaluations
CREATE POLICY "Authenticated users can view evaluations"
ON public.evaluations FOR SELECT TO authenticated
USING (true);

-- Evaluators can insert their own evaluations
CREATE POLICY "Users can insert own evaluations"
ON public.evaluations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = evaluator_id);

-- Evaluators can update their own draft evaluations
CREATE POLICY "Users can update own evaluations"
ON public.evaluations FOR UPDATE TO authenticated
USING (auth.uid() = evaluator_id);

-- Admins can delete evaluations
CREATE POLICY "Admins can delete evaluations"
ON public.evaluations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_evaluations_updated_at
BEFORE UPDATE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;
