begin;

-- =========================================================
-- 1. Tabla de perfiles
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_plan_check
    check (plan in ('free', 'pro'))
);

-- La seguridad por filas se activa explícitamente,
-- independientemente de la configuración del proyecto.
alter table public.profiles enable row level security;


-- =========================================================
-- 2. Permisos mínimos de la Data API
-- =========================================================

-- El esquema public ya está disponible para la Data API,
-- pero concedemos únicamente los permisos que necesita
-- un usuario autenticado.
grant usage on schema public to authenticated;

revoke all on table public.profiles from public;
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

-- El usuario puede leer su perfil.
grant select on table public.profiles to authenticated;

-- El usuario solo podrá modificar estos dos campos.
-- No puede convertir su propio plan de Free a Pro.
grant update (full_name, avatar_url)
on table public.profiles
to authenticated;


-- =========================================================
-- 3. Políticas Row Level Security
-- =========================================================

drop policy if exists "Users can view their own profile"
on public.profiles;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);


drop policy if exists "Users can update their own profile"
on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);


-- =========================================================
-- 4. Actualización automática de updated_at
-- =========================================================

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at
on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();


-- =========================================================
-- 5. Creación automática del perfil al registrarse
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1),
      'Usuario'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- =========================================================
-- 6. Crear perfiles para usuarios que ya existen
-- =========================================================

insert into public.profiles (
  id,
  full_name,
  avatar_url
)
select
  users.id,
  coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name',
    split_part(users.email, '@', 1),
    'Usuario'
  ),
  coalesce(
    users.raw_user_meta_data ->> 'avatar_url',
    users.raw_user_meta_data ->> 'picture'
  )
from auth.users as users
on conflict (id) do nothing;

commit;


-- =========================================================
-- 7. Resultado de comprobación
-- =========================================================

select
  id,
  full_name,
  avatar_url,
  plan,
  created_at,
  updated_at
from public.profiles
order by created_at;