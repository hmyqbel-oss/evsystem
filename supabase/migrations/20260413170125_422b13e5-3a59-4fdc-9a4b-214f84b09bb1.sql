-- Add new columns
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS specialty text NOT NULL DEFAULT '';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS data_entry_name text NOT NULL DEFAULT '';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS data_entry_role text NOT NULL DEFAULT '';

-- Remove unused columns
ALTER TABLE public.organizations DROP COLUMN IF EXISTS license_number;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS members_count;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS founded_date;