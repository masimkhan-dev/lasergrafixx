-- Allow customers without phone numbers
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
