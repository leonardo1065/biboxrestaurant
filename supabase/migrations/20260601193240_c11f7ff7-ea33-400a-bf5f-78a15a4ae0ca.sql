
create type public.app_role as enum ('admin', 'caixa', 'garcom', 'cozinha');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "profiles_update_own_or_admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "user_roles_select_self_or_admin" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "user_roles_admin_insert" on public.user_roles
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "user_roles_admin_update" on public.user_roles
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "user_roles_admin_delete" on public.user_roles
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare is_first boolean;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email);

  select count(*) = 0 into is_first from public.user_roles;
  insert into public.user_roles (user_id, role)
  values (new.id, case when is_first then 'admin'::public.app_role else 'garcom'::public.app_role end);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
