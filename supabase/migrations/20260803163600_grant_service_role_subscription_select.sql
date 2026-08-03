begin;

-- El backend administrativo necesita leer la suscripción
-- para crear Checkout y Customer Portal de forma segura.
grant select
on table public.subscriptions
to service_role;

commit;


-- =========================================================
-- Comprobación
-- =========================================================

select
  has_table_privilege(
    'service_role',
    'public.subscriptions',
    'select'
  ) as service_role_can_select,
  has_table_privilege(
    'anon',
    'public.subscriptions',
    'select'
  ) as anon_can_select,
  has_table_privilege(
    'authenticated',
    'public.subscriptions',
    'select'
  ) as authenticated_can_select;