do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservation_requests'
      and column_name = 'selected_pet_ids'
      and udt_name = '_uuid'
  ) then
    alter table public.reservation_requests
      alter column selected_pet_ids type text[]
      using selected_pet_ids::text[];
  end if;
end $$;

alter table public.reservation_requests
  add column if not exists location text,
  add column if not exists reservation_type text,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists amenity_package text,
  add column if not exists suite_size text,
  add column if not exists enrichment_enabled boolean not null default false,
  add column if not exists enrichment_frequency text,
  add column if not exists spa_service text,
  add column if not exists spa_upgrades text[] not null default '{}',
  add column if not exists authorized_pickup text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reservation_requests_location_check'
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_location_check
      check (location in ('Amarillo', 'Wichita Falls', 'New Braunfels'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reservation_requests_reservation_type_check'
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_reservation_type_check
      check (reservation_type in ('Boarding', 'Daycare', 'Spa'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reservation_requests_amenity_package_check'
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_amenity_package_check
      check (amenity_package in ('Classic', 'Premium', 'Platinum VIP'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reservation_requests_suite_size_check'
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_suite_size_check
      check (
        suite_size in (
          'Champion (4x8)',
          'Olympian (6x8)',
          'Royal (8x8)',
          'Chateau (10x8)'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reservation_requests_spa_service_check'
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_spa_service_check
      check (spa_service is null or spa_service in ('Rapid Bath', 'BBB', 'PPP'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reservation_requests_enrichment_frequency_check'
  ) then
    alter table public.reservation_requests
      add constraint reservation_requests_enrichment_frequency_check
      check (
        enrichment_frequency is null
        or enrichment_frequency in ('Daily', 'Every other day')
      );
  end if;
end $$;

create index if not exists reservation_requests_user_created_idx
  on public.reservation_requests (user_id, created_at desc);

create index if not exists reservation_requests_status_idx
  on public.reservation_requests (status);
