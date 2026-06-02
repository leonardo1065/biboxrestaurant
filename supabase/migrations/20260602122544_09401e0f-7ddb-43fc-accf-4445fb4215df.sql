CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  CREATE TYPE public.employee_role AS ENUM ('gerente','atendente','balconista','cozinheiro','ajudante_cozinha','auxiliar','garcom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  role public.employee_role NOT NULL,
  salary numeric(10,2) NOT NULL DEFAULT 0,
  work_days text[] NOT NULL DEFAULT '{}',
  day_off text,
  hired_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_admin_select" ON public.employees FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "employees_admin_insert" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "employees_admin_update" ON public.employees FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "employees_admin_delete" ON public.employees FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
