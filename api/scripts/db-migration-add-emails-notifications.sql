-- BarberFlow: migration script to add guest_email, notifications and logs
-- WARNING: run on a test environment first and always have a backup

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add guest_email to appointments
ALTER TABLE IF EXISTS appointments
ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  barber_id uuid,
  tenant_id uuid,
  appointment_id uuid,
  type text,
  message text,
  created_at timestamp DEFAULT now(),
  seen boolean DEFAULT false
);

-- Create booking_override_logs table if not exists
CREATE TABLE IF NOT EXISTS booking_override_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id uuid,
  admin_id uuid,
  reason text,
  created_at timestamp DEFAULT now()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_notifications_barber_id ON notifications(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_guest_email ON appointments(guest_email);

-- End of script
