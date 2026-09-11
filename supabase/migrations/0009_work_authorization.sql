-- Phase 8: Application Assistant — work authorization isn't captured
-- anywhere in the schema today, but the extension needs to answer this
-- category of application question as a stored fact, never inferred.

alter table public.profiles
  add column work_authorization_status text,
  add column requires_sponsorship boolean;
