begin;

-- =========================================================
-- 1. Sincronización segura durante la eliminación de cuenta
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

  /*
   * Bloqueamos el perfil mientras se sincroniza el webhook.
   * Si una eliminación de cuenta está en curso, la cascada
   * esperará a que esta transacción termine.
   */
  perform 1
  from public.profiles
  where id = p_user_id
  for key share;

  if not found then
    /*
     * Un customer.subscription.deleted puede llegar después
     * de que la cuenta ya haya sido eliminada. Es un resultado
     * esperado y debe responderse correctamente a Stripe.
     */
    if p_status = 'canceled' then
      return false;
    end if;

    raise exception
      'No existe un perfil para el usuario %',
      p_user_id;
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
-- 2. Permisos
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
