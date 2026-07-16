alter table public.reservation_requests
  add column if not exists selected_pet_names text[] not null default '{}',
  add column if not exists notification_status text not null default 'pending',
  add column if not exists notified_at timestamptz,
  add column if not exists notification_error text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservation_requests_notification_status_check'
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_notification_status_check
      check (notification_status in ('pending', 'sent', 'failed'));
  end if;
end $$;
