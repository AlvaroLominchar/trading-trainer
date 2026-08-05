begin;

-- =========================================================
-- 1. Eliminar la firma temporal del webhook anterior
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
  text,
  timestamptz,
  boolean,
  timestamptz
);

commit;


-- =========================================================
-- 2. Comprobación
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