alter table public.reservation_requests
  drop constraint if exists reservation_requests_suite_size_check;

alter table public.reservation_requests
  add constraint reservation_requests_suite_size_check
  check (
    suite_size is null
    or suite_size in (
      'Champion (4x8)',
      'Olympian (6x8)',
      'Royal (8x8)',
      'Chateau (10x8)',
      'Condo',
      'Penthouse',
      'Villa'
    )
  );
