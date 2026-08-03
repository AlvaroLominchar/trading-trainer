begin;

-- =========================================================
-- 1. Verificación defensiva
-- =========================================================

do $$
begin
  if exists (
    select 1
    from public.profiles
    where plan = 'pro'
  ) then
    raise exception
      'Todavía existen perfiles con el plan legacy pro.';
  end if;
end;
$$;


-- =========================================================
-- 2. Eliminar las dos firmas temporales antiguas
-- =========================================================

drop function if exists public.sync_stripe_subscription(
  text,
  text,
  timestamptz,
  uuid,
  text,
  text,
  text,
  text,
  timestamptz,
  boolean
);

drop function if exists public.sync_stripe_subscription(
  text,
  text,
  timestamptz,
  uuid,
  text,
  text,
  text,
  text,
  text,
  timestamptz,
  boolean
);

commit;


-- =========================================================
-- 3. Comprobación
-- =========================================================

select
  function_definition.oid::regprocedure::text as signature,
  has_function_privilege(
    'service_role',
    function_definition.oid,
    'execute'
  ) as service_role_can_execute
from pg_proc as function_definition
join pg_namespace as function_schema
  on function_schema.oid =
    function_definition.pronamespace
where function_schema.nspname = 'public'
  and function_definition.proname =
    'sync_stripe_subscription'
order by signature;