begin;

alter table public.training_attempts
  add column wait_count smallint not null default 0,
  add column timing_score smallint;

alter table public.training_attempts
  add constraint training_attempts_wait_count_check
    check (wait_count between 0 and 3),
  add constraint training_attempts_timing_score_check
    check (timing_score is null or timing_score between 0 and 100);

comment on column public.training_attempts.wait_count is
  'Number of one-candle deferrals made before the final long/short/no_trade decision.';

comment on column public.training_attempts.timing_score is
  'Deterministic Timing skill score. Null when the attempt produced no Timing observation.';

commit;
