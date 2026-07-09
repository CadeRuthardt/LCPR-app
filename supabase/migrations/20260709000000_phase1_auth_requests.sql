create extension if not exists pgcrypto;

create table if not exists public.client_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  gingr_client_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.phase1_seed_pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  breed text,
  age text,
  weight text,
  care_note text,
  status text not null default 'active' check (status in ('active', 'wellness')),
  vaccination_summary text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.reservation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  selected_pet_ids uuid[] not null check (cardinality(selected_pet_ids) > 0),
  start_date date not null,
  end_date date not null,
  experience text not null,
  optional_services text[] not null default '{}',
  notes text,
  status text not null default 'submitted' check (
    status in ('submitted', 'under_review', 'action_required', 'confirmed', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists client_profiles_set_updated_at on public.client_profiles;
create trigger client_profiles_set_updated_at
before update on public.client_profiles
for each row execute function public.set_updated_at();

drop trigger if exists reservation_requests_set_updated_at on public.reservation_requests;
create trigger reservation_requests_set_updated_at
before update on public.reservation_requests
for each row execute function public.set_updated_at();

alter table public.client_profiles enable row level security;
alter table public.phase1_seed_pets enable row level security;
alter table public.reservation_requests enable row level security;

drop policy if exists "Clients can read their own profile" on public.client_profiles;
create policy "Clients can read their own profile"
on public.client_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Clients can read their own seed pets" on public.phase1_seed_pets;
create policy "Clients can read their own seed pets"
on public.phase1_seed_pets
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Clients can read their own reservation requests" on public.reservation_requests;
create policy "Clients can read their own reservation requests"
on public.reservation_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Clients can create their own submitted reservation requests" on public.reservation_requests;
create policy "Clients can create their own submitted reservation requests"
on public.reservation_requests
for insert
to authenticated
with check (auth.uid() = user_id and status = 'submitted');
