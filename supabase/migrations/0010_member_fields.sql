-- ============================================================================
-- Extend members with the fields actually collected today (previously via a
-- Google Form): date of birth, gender, department. Nullable — existing rows
-- and the public subscribe/contact forms don't collect these, only the
-- admin "Add Member" form and the CSV import do.
-- ============================================================================

alter table public.members
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists department text;
