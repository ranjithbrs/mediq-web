-- Migration: 20260906143100_hospital_staff_association_and_rls.sql
-- Description: Create hospital_staff table, get_user_hospital_id() helper, and configure RLS for hospital staff.

-- 1. Create public.hospital_staff table
CREATE TABLE IF NOT EXISTS public.hospital_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE NOT NULL,
    staff_role TEXT NOT NULL DEFAULT 'emergency_desk',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ensure a user account is associated with at most one hospital
    CONSTRAINT uq_hospital_staff_user UNIQUE (user_id)
);

-- 2. Create indexes for hospital_staff
CREATE INDEX IF NOT EXISTS idx_hospital_staff_user_id ON public.hospital_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_staff_hospital_id ON public.hospital_staff(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_staff_active ON public.hospital_staff(is_active);

-- 3. Enable RLS on public.hospital_staff
ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;

-- 4. Helper function to securely resolve an authenticated user's active hospital ID
CREATE OR REPLACE FUNCTION public.get_user_hospital_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hospital_id
  FROM public.hospital_staff
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1;
$$;

-- 5. RLS Policies on public.hospital_staff
-- Staff can view their own hospital staff record
CREATE POLICY "Staff can view their own hospital staff record"
ON public.hospital_staff
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- System Admins can view and manage all hospital staff records
CREATE POLICY "Admins can manage all hospital staff"
ON public.hospital_staff
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Hospital Staff RLS Policies on public.emergency_alerts
-- Hospital staff can view alerts dispatched to their assigned hospital
CREATE POLICY "Hospital staff can view alerts for their hospital"
ON public.emergency_alerts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'hospital')
  AND hospital_id = public.get_user_hospital_id(auth.uid())
);

-- Hospital staff can update status of alerts for their assigned hospital
CREATE POLICY "Hospital staff can update alerts for their hospital"
ON public.emergency_alerts
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'hospital')
  AND hospital_id = public.get_user_hospital_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'hospital')
  AND hospital_id = public.get_user_hospital_id(auth.uid())
);
