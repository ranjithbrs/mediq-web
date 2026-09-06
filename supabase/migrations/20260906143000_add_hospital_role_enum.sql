-- 1. Add 'hospital' to public.app_role enum (committed in separate transaction)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hospital';
