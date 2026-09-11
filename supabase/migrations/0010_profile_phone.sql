-- Phase 8: a second gap found while wiring answer derivation — phone
-- number (a near-universal application field) isn't captured anywhere
-- in the schema either. Same reasoning as 0009_work_authorization.sql.

alter table public.profiles add column phone text;
