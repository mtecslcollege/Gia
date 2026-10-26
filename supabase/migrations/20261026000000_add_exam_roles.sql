-- Migration 2a: new roles. Kept in its own file because a new enum value cannot be
-- used in the same transaction that adds it.
alter type public.app_role add value if not exists 'exam_officer';
alter type public.app_role add value if not exists 'registrar';
