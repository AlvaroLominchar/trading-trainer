begin;

-- =========================================================
-- 1. Tabla de suscripciones
-- =========================================================

create table public.subscriptions (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  stripe_price_id text not null,

  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  stripe_event_created_at timestamptz not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscriptions_customer_id_unique
    unique (stripe_customer_id),

  constraint subscriptions_subscription_id_unique
    unique (stripe_subscription_id),

  constraint subscriptions_status_check
    check (
      status in (
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused'
      )
    )
);

alter table public.subscriptions
enable row level security;


-- =========================================================
-- 2. Registro idempotente de eventos de Stripe
-- =========================================================

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  event_created_at timestamptz not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events
enable row level security;


-- =========================================================
-- 3. Permisos
-- =========================================================

revoke all on table public.subscriptions from public;
revoke all on table public.subscriptions from anon;
revoke all on table public.subscriptions from authenticated;

revoke all on table public.stripe_webhook_events from public;
revoke all on table public.stripe_webhook_events from anon;
revoke all on table public.stripe_webhook_events from authenticated;

-- No se crean políticas para usuarios normales.
-- Solo el backend privilegiado del webhook podrá acceder.


-- =========================================================
-- 4. Actualización automática de updated_at
-- =========================================================

create or replace function public.set_subscription_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_subscription_updated_at();


-- =========================================================
-- 5. Sincronización atómica e idempotente
-- =========================================================

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
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_inserted boolean;
  current_subscription_status text;
begin
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

  select subscriptions.status
  into current_subscription_status
  from public.subscriptions as subscriptions
  where subscriptions.user_id = p_user_id;

  update public.profiles
  set
    plan = case
      when current_subscription_status in ('active', 'trialing')
        then 'pro'
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
) from public;

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
) from anon;

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
) from authenticated;

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
-- 6. Comprobación
-- =========================================================

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'subscriptions',
    'stripe_webhook_events'
  )
order by tablename;