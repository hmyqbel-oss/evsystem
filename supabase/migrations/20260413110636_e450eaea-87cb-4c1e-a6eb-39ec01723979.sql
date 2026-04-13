
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  license_number TEXT NOT NULL DEFAULT '',
  founded_date TEXT DEFAULT '',
  members_count INTEGER NOT NULL DEFAULT 0,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view organizations
CREATE POLICY "Authenticated users can view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update organizations"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete organizations"
  ON public.organizations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.organizations (name, city, region, license_number, founded_date, members_count, email, phone) VALUES
  ('جمعية الشباب الرائد', 'الرياض', 'منطقة الرياض', '1234', '2018-03-15', 45, 'info@shabab.org', '0551234567'),
  ('جمعية بناء المستقبل', 'جدة', 'منطقة مكة المكرمة', '5678', '2020-01-10', 32, 'info@binaa.org', '0559876543'),
  ('جمعية أجيال الغد', 'الدمام', 'المنطقة الشرقية', '9012', '2019-07-22', 28, 'info@ajyal.org', '0553456789');
