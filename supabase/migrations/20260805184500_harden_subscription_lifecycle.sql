begin;

-- =========================================================
-- 1. Fecha de creación de la suscripción en Stripe
-- =========================================================

alter table public.subscriptions
add column if not exists
  stripe_subscription_created_at timestamptz;

/*
 * Para las filas existentes usamos provisionalmente la fecha
 * del último evento almacenado. El siguiente webhook de esa
 * misma suscripción guardará su fecha real de creación.
 */
update public.subscriptions
set stripe_subscription_created_at =
  stripe_event_created_at
where stripe_subscription_created_at is null;

alter table public.subscriptions
alter column stripe_subscription_created_at
set not null;


-- =========================================================
-- 2. Función definitiva con protección entre suscripciones
-- =========================================================

create or replace function public.sync_stripe_subscription(
  p_event_id text,
  p_event_type text,
  p_event_created_at timestamptz,
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_subscription_created_at timestamptz,
  p_stripe_price_id text,
  p_plan text,
  p_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_cancel_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_inserted boolean;
  current_subscription_status text;
  current_subscription_plan text;
begin
  if p_plan not in ('plus', 'premium') then
    raise exception
      'El plan de suscripción no es válido: %',
      p_plan;
  end if;

  if p_subscription_created_at is null then
    raise exception
      'La fecha de creación de la suscripción es obligatoria.';
  end if;

  insert into public.stripe_webhook_events (
    event_id,
    event_type,
    event_created_at
  )
  values (
    p_event_id,
    p_event_type,
    p_event_created_at
  )
  on conflict (event_id) do nothing
  returning true into event_inserted;

  if coalesce(event_inserted, false) = false then
    return false;
  end if;

  insert into public.subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_subscription_created_at,
    stripe_price_id,
    plan,
    status,
    current_period_end,
    cancel_at_period_end,
    cancel_at,
    stripe_event_created_at
  )
  values (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_subscription_created_at,
    p_stripe_price_id,
    p_plan,
    p_status,
    p_current_period_end,
    p_cancel_at_period_end,
    p_cancel_at,
    p_event_created_at
  )
  on conflict (user_id) do update
  set
    stripe_customer_id =
      excluded.stripe_customer_id,
    stripe_subscription_id =
      excluded.stripe_subscription_id,
    stripe_subscription_created_at =
      excluded.stripe_subscription_created_at,
    stripe_price_id =
      excluded.stripe_price_id,
    plan =
      excluded.plan,
    status =
      excluded.status,
    current_period_end =
      excluded.current_period_end,
    cancel_at_period_end =
      excluded.cancel_at_period_end,
    cancel_at =
      excluded.cancel_at,
    stripe_event_created_at =
      excluded.stripe_event_created_at
  where
    (
      excluded.stripe_subscription_id =
        public.subscriptions.stripe_subscription_id
      and
      excluded.stripe_event_created_at >=
        public.subscriptions.stripe_event_created_at
    )
    or
    (
      excluded.stripe_subscription_id <>
        public.subscriptions.stripe_subscription_id
      and
      excluded.stripe_subscription_created_at >
        public.subscriptions.stripe_subscription_created_at
    );

  select
    subscriptions.status,
    subscriptions.plan
  into
    current_subscription_status,
    current_subscription_plan
  from public.subscriptions as subscriptions
  where subscriptions.user_id = p_user_id;

  update public.profiles
  set
    plan = case
      /*
       * past_due conserva acceso mientras Stripe intenta
       * recuperar el cobro.
       */
      when current_subscription_status in (
        'active',
        'trialing',
        'past_due'
      )
        then current_subscription_plan

      else 'free'
    end
  where id = p_user_id;

  if not found then
    raise exception
      'No existe un perfil para el usuario %',
      p_user_id;
  end if;

  return true;
end;
$$;


-- =========================================================
-- 3. Compatibilidad temporal con el webhook desplegado
-- =========================================================

/*
 * Esta firma de 12 parámetros se conserva temporalmente.
 * Se eliminará cuando Vercel ya ejecute el webhook nuevo.
 */
create or replace function public.sync_stripe_subscription(
  p_event_id text,
  p_event_type text,
  p_event_created_at timestamptz,
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_plan text,
  p_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_cancel_at timestamptz
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select public.sync_stripe_subscription(
    p_event_id,
    p_event_type,
    p_event_created_at,
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,

    coalesce(
        (
            select
            subscriptions.stripe_subscription_created_at
            from public.subscriptions as subscriptions
            where
            subscriptions.user_id = p_user_id
            and
            subscriptions.stripe_subscription_id =
                p_stripe_subscription_id
        ),
        (
            select
            case
                when subscriptions.status in (
                'canceled',
                'incomplete_expired'
                )
                and p_event_type in (
                'checkout.session.completed',
                'customer.subscription.created'
                )
                then p_event_created_at

                else '-infinity'::timestamptz
            end
            from public.subscriptions as subscriptions
            where subscriptions.user_id = p_user_id
        ),
        p_event_created_at
    ),

    p_stripe_price_id,
    p_plan,
    p_status,
    p_current_period_end,
    p_cancel_at_period_end,
    p_cancel_at
  );
$$;


-- =========================================================
-- 4. Permisos
-- =========================================================

revoke all on function public.sync_stripe_subscription(
  text,
  text,
  timestamptz,
  uuid,
  text,
  text,
  timestamptz,
  text,
  text,
  text,
  timestamptz,
  boolean,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.sync_stripe_subscription(
  text,
  text,
  timestamptz,
  uuid,
  text,
  text,
  timestamptz,
  text,
  text,
  text,
  timestamptz,
  boolean,
  timestamptz
) to service_role;


revoke all on function public.sync_stripe_subscription(
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
) from public, anon, authenticated;

grant execute on function public.sync_stripe_subscription(
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
) to service_role;

commit;


-- =========================================================
-- 5. Comprobación
-- =========================================================

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'subscriptions'
  and column_name =
    'stripe_subscription_created_at';


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