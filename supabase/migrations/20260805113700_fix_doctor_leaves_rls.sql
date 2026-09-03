-- Helper function with SECURITY DEFINER to check if doctor_id belongs to current authenticated user
CREATE OR REPLACE FUNCTION public.is_doctor_owner(d_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.doctors d
    WHERE d.id = d_id
      AND d.email = COALESCE(auth.jwt() ->> 'email', (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
$$;

-- Drop existing policies on doctor_leaves
DROP POLICY IF EXISTS "Doctors can insert their own leaves" ON public.doctor_leaves;
DROP POLICY IF EXISTS "Doctors can update their own leaves" ON public.doctor_leaves;
DROP POLICY IF EXISTS "Doctors can delete their own leaves" ON public.doctor_leaves;
DROP POLICY IF EXISTS "Anyone can view doctor leaves" ON public.doctor_leaves;

-- Re-create policies using SECURITY DEFINER helper function
CREATE POLICY "Anyone can view doctor leaves" ON public.doctor_leaves
  FOR SELECT USING (true);

CREATE POLICY "Doctors can insert their own leaves" ON public.doctor_leaves
  FOR INSERT TO authenticated
  WITH CHECK (public.is_doctor_owner(doctor_id));

CREATE POLICY "Doctors can update their own leaves" ON public.doctor_leaves
  FOR UPDATE TO authenticated
  USING (public.is_doctor_owner(doctor_id))
  WITH CHECK (public.is_doctor_owner(doctor_id));

CREATE POLICY "Doctors can delete their own leaves" ON public.doctor_leaves
  FOR DELETE TO authenticated
  USING (public.is_doctor_owner(doctor_id));
