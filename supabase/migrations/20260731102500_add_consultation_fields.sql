-- Migration: Add diagnosis, prescription, and doctor_notes to appointments table
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS prescription TEXT,
ADD COLUMN IF NOT EXISTS doctor_notes TEXT;
