begin;

-- =========================================================
-- 1. Estado de onboarding del perfil
-- =========================================================

alter table public.profiles
add column if not exists
  onboarding_completed_at timestamptz;

/*
 * Los usuarios que ya existían antes de esta migración
 * se consideran incorporados para no mostrarles una
 * bienvenida retroactiva.
 */
update public.profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;


-- =========================================================
-- 2. Nuevos usuarios con onboarding pendiente
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
    avatar_url,
    onboarding_completed_at
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
    ),
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


-- =========================================================
-- 3. Completar onboarding de forma controlada
-- =========================================================

create or replace function public.complete_profile_onboarding()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid;
begin
  current_user_id := (select auth.uid());

  if current_user_id is null then
    raise exception
      'No existe un usuario autenticado.';
  end if;

  update public.profiles
  set onboarding_completed_at =
    coalesce(onboarding_completed_at, now())
  where id = current_user_id;

  return found;
end;
$$;

revoke all on function public.complete_profile_onboarding()
from public, anon;

grant execute on function public.complete_profile_onboarding()
to authenticated;

commit;


-- =========================================================
-- 4. Comprobación
-- =========================================================

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'onboarding_completed_at';


select
  function_definition.oid::regprocedure::text as signature,
  has_function_privilege(
    'authenticated',
    function_definition.oid,
    'execute'
  ) as authenticated_can_execute
from pg_proc as function_definition
join pg_namespace as function_schema
  on function_schema.oid =
    function_definition.pronamespace
where function_schema.nspname = 'public'
  and function_definition.proname =
    'complete_profile_onboarding';
