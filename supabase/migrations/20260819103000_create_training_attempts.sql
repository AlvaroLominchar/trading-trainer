begin;

-- =========================================================
-- 1. Intentos de entrenamiento inmutables
-- =========================================================

create table public.training_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_fingerprint text not null,
  exercise_id text not null,
  exercise_version integer not null,
  exercise_title text not null,
  timeframe text not null,
  source_kind text not null,
  rubric_version integer not null,
  management_rubric_version integer,
  decision text not null,
  confidence smallint not null,
  trade_plan jsonb,
  idea_score smallint not null,
  idea_rating text not null,
  is_top_rated_decision boolean not null,
  skill_scores jsonb not null,
  idea_summary text not null,
  idea_reasons jsonb not null,
  plan_score smallint,
  plan_component_scores jsonb,
  management_score smallint,
  management_actions jsonb not null default '[]'::jsonb,
  outcome text not null,
  exit_price numeric,
  created_at timestamptz not null default now(),

  constraint training_attempts_exercise_version_check
    check (exercise_version > 0),

  constraint training_attempts_rubric_version_check
    check (rubric_version > 0),

  constraint training_attempts_management_rubric_version_check
    check (
      management_rubric_version is null or
      management_rubric_version > 0
    ),

  constraint training_attempts_decision_check
    check (decision in ('long', 'no_trade', 'short')),

  constraint training_attempts_confidence_check
    check (confidence between 50 and 100),

  constraint training_attempts_idea_score_check
    check (idea_score between 0 and 100),

  constraint training_attempts_idea_rating_check
    check (idea_rating in ('strong', 'acceptable', 'weak')),

  constraint training_attempts_plan_score_check
    check (plan_score is null or plan_score between 0 and 100),

  constraint training_attempts_management_score_check
    check (
      management_score is null or
      management_score between 0 and 100
    ),

  constraint training_attempts_outcome_check
    check (
      outcome in (
        'no_trade',
        'stop_hit',
        'target_hit',
        'ambiguous',
        'manual_close',
        'scenario_end'
      )
    ),

  constraint training_attempts_skill_scores_array_check
    check (jsonb_typeof(skill_scores) = 'array'),

  constraint training_attempts_idea_reasons_array_check
    check (jsonb_typeof(idea_reasons) = 'array'),

  constraint training_attempts_management_actions_array_check
    check (jsonb_typeof(management_actions) = 'array'),

  constraint training_attempts_trade_plan_object_check
    check (
      trade_plan is null or
      jsonb_typeof(trade_plan) = 'object'
    ),

  constraint training_attempts_plan_components_array_check
    check (
      plan_component_scores is null or
      jsonb_typeof(plan_component_scores) = 'array'
    ),

  constraint training_attempts_decision_dimensions_check
    check (
      (
        decision = 'no_trade' and
        trade_plan is null and
        plan_score is null and
        plan_component_scores is null and
        management_rubric_version is null and
        management_score is null and
        management_actions = '[]'::jsonb and
        outcome = 'no_trade'
      )
      or
      (
        decision in ('long', 'short') and
        trade_plan is not null and
        plan_score is not null and
        plan_component_scores is not null and
        management_rubric_version is not null and
        outcome <> 'no_trade'
      )
    )
);

create index training_attempts_user_created_at_idx
on public.training_attempts (user_id, created_at desc);

alter table public.training_attempts enable row level security;


-- =========================================================
-- 2. Data API: lectura propia, escritura solo desde servidor
-- =========================================================

revoke all on table public.training_attempts from public;
revoke all on table public.training_attempts from anon;
revoke all on table public.training_attempts from authenticated;
revoke all on table public.training_attempts from service_role;

grant select on table public.training_attempts to authenticated;
grant select, insert on table public.training_attempts to service_role;


-- =========================================================
-- 3. Row Level Security para historial futuro
-- =========================================================

drop policy if exists "Users can view their own training attempts"
on public.training_attempts;

create policy "Users can view their own training attempts"
on public.training_attempts
for select
to authenticated
using (
  (select auth.uid()) is not null and
  (select auth.uid()) = user_id
);

commit;


-- =========================================================
-- 4. Comprobación
-- =========================================================

select
  relation.relname as table_name,
  relation.relrowsecurity as row_security
from pg_class as relation
join pg_namespace as relation_schema
  on relation_schema.oid = relation.relnamespace
where relation_schema.nspname = 'public'
  and relation.relname = 'training_attempts';
