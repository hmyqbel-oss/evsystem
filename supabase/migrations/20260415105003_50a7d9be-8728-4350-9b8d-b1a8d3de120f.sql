-- Add license_number column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN license_number TEXT DEFAULT '';

-- Add establishment_year column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN establishment_year INTEGER;