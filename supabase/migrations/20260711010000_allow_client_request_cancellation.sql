drop policy if exists "Clients can cancel their own unconfirmed reservation requests"
on public.reservation_requests;

create policy "Clients can cancel their own unconfirmed reservation requests"
on public.reservation_requests
for update
to authenticated
using (
  auth.uid() = user_id
  and status in ('submitted', 'under_review', 'action_required')
)
with check (
  auth.uid() = user_id
  and status = 'cancelled'
);

create or replace function public.enforce_client_request_cancellation_only()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' and old.user_id = auth.uid() then
    if new.status = 'cancelled' and old.status in ('submitted', 'under_review', 'action_required') then
      if new.id is distinct from old.id
        or new.user_id is distinct from old.user_id
        or new.selected_pet_ids is distinct from old.selected_pet_ids
        or new.start_date is distinct from old.start_date
        or new.end_date is distinct from old.end_date
        or new.experience is distinct from old.experience
        or new.optional_services is distinct from old.optional_services
        or new.notes is distinct from old.notes
        or new.created_at is distinct from old.created_at
        or new.location is distinct from old.location
        or new.reservation_type is distinct from old.reservation_type
        or new.start_time is distinct from old.start_time
        or new.end_time is distinct from old.end_time
        or new.amenity_package is distinct from old.amenity_package
        or new.suite_size is distinct from old.suite_size
        or new.enrichment_enabled is distinct from old.enrichment_enabled
        or new.enrichment_frequency is distinct from old.enrichment_frequency
        or new.spa_service is distinct from old.spa_service
        or new.spa_upgrades is distinct from old.spa_upgrades
        or new.authorized_pickup is distinct from old.authorized_pickup
      then
        raise exception 'Clients may only cancel unconfirmed reservation requests.';
      end if;

      return new;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists reservation_requests_client_cancel_only
on public.reservation_requests;

create trigger reservation_requests_client_cancel_only
before update on public.reservation_requests
for each row
execute function public.enforce_client_request_cancellation_only();
