begin;

-- =========================================================
-- 1. Migrar perfiles: pro pasa a premium
-- =========================================================

alter table public.profiles
drop constraint if exists profiles_plan_check;

update public.profiles
set plan = 'premium'
where plan = 'pro';

alter table public.profiles
add constraint profiles_plan_check
check (plan in ('free', 'plus', 'premium'));


-- =========================================================
-- 2. Guardar el plan comercial en subscriptions
-- =========================================================

alter table public.subscriptions
add column if not exists plan text;

-- Hasta ahora solo existía la tarifa de 19,99 €/mes,
-- que ahora corresponde al plan Premium.
update public.subscriptions
set plan = 'premium'
where plan is null;

alter table public.subscriptions
alter column plan set not null;

alter table public.subscriptions
drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
add constraint subscriptions_plan_check
check (plan in ('plus', 'premium'));


-- =========================================================
-- 3. Función nueva para Plus y Premium
-- =========================================================

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
  p_cancel_at_period_end boolean
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
    stripe_price_id,
    plan,
    status,
    current_period_end,
    cancel_at_period_end,
    stripe_event_created_at
  )
  values (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_plan,
    p_status,
    p_current_period_end,
    p_cancel_at_period_end,
    p_event_created_at
  )
  on conflict (user_id) do update
  set
    stripe_customer_id =
      excluded.stripe_customer_id,
    stripe_subscription_id =
      excluded.stripe_subscription_id,
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
    stripe_event_created_at =
      excluded.stripe_event_created_at
  where
    excluded.stripe_event_created_at >=
      public.subscriptions.stripe_event_created_at;

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
      when current_subscription_status in ('active', 'trialing')
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
-- 4. Compatibilidad temporal con el webhook ya desplegado
-- =========================================================

-- La versión actualmente desplegada todavía llama a la función
-- sin p_plan. Como hasta ahora solo reconoce la tarifa de 19,99 €,
-- esa llamada antigua equivale de forma segura a Premium.

create or replace function public.sync_stripe_subscription(
  p_event_id text,
  p_event_type text,
  p_event_created_at timestamptz,
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
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
    p_stripe_price_id,
    'premium',
    p_status,
    p_current_period_end,
    p_cancel_at_period_end
  );
$$;


-- =========================================================
-- 5. Permisos de ambas versiones
-- =========================================================

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
  boolean
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
  boolean
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
  timestamptz,
  boolean
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
  timestamptz,
  boolean
) to service_role;

commit;


-- =========================================================
-- 6. Comprobación posterior
-- =========================================================

select
  plan,
  count(*) as profile_count
from public.profiles
group by plan
order by plan;

select
  plan,
  status,
  count(*) as subscription_count
from public.subscriptions
group by plan, status
order by plan, status;