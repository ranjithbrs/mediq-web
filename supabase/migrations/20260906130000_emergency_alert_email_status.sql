-- Add email tracking and idempotency columns to emergency_alerts table
ALTER TABLE public.emergency_alerts
ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_error TEXT;

-- Add index on email_status for performance
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_email_status ON public.emergency_alerts(email_status);
