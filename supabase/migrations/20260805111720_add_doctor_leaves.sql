-- Create doctor_leaves table
CREATE TABLE public.doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  leave_type TEXT NOT NULL DEFAULT 'full_day',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_doctor_leave UNIQUE (doctor_id, leave_date)
);

-- Enable RLS
ALTER TABLE public.doctor_leaves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view doctor leaves" ON public.doctor_leaves
  FOR SELECT USING (true);

CREATE POLICY "Doctors can insert their own leaves" ON public.doctor_leaves
  FOR INSERT TO authenticated
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Doctors can update their own leaves" ON public.doctor_leaves
  FOR UPDATE TO authenticated
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())))
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Doctors can delete their own leaves" ON public.doctor_leaves
  FOR DELETE TO authenticated
  USING (doctor_id IN (SELECT id FROM public.doctors WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

-- Create trigger for updated_at
CREATE TRIGGER update_doctor_leaves_updated_at
  BEFORE UPDATE ON public.doctor_leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_doctor_leaves_doctor_id ON public.doctor_leaves(doctor_id);
CREATE INDEX idx_doctor_leaves_leave_date ON public.doctor_leaves(leave_date);
