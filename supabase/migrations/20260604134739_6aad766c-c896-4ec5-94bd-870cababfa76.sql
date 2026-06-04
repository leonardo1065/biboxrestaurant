ALTER TYPE public.employee_role ADD VALUE IF NOT EXISTS 'copeiro';
ALTER TYPE public.employee_role ADD VALUE IF NOT EXISTS 'faxineiro';
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS apto text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS bloco text;