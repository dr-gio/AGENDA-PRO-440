-- ============================================================
-- SQL Schema for Supabase (PostgreSQL)
-- Agenda Clínica 440 by Dr. Gio
-- 
-- ARQUITECTURA OFICIAL:
--   Agenda 440 → Google Calendar → GoHighLevel
-- ============================================================

-- 1. Profiles Table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'reception', 'coordination', 'doctor', 'assistant')) DEFAULT 'reception',
  google_calendar_id TEXT, -- Personal Google Calendar ID for this user
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Patients Table
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'CC',
  document_number TEXT NOT NULL,
  birth_date DATE,
  gender TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 3. Professionals Table
CREATE TABLE professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT CHECK (type IN ('internal', 'external')) DEFAULT 'internal',
  google_calendar_id TEXT, -- Google Calendar ID for this professional
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Resources Table
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  google_calendar_id TEXT, -- Google Calendar ID for this resource
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  availability JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Appointment Types Table
CREATE TABLE appointment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  color TEXT DEFAULT '#2563eb', -- display color
  is_resource_required BOOLEAN DEFAULT FALSE,
  buffer_before INTEGER DEFAULT 0,
  buffer_after INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments Table (CORE TABLE — Source of Truth)
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core clinical data
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  type_id UUID REFERENCES appointment_types(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'cancelled', 'attended', 'no-show')) DEFAULT 'pending',
  observations TEXT,

  -- Google Calendar Sync Fields (MANDATORY)
  google_event_id TEXT,         -- The event ID in Google Calendar
  google_calendar_id TEXT,      -- The calendar ID where the event lives (drgio@440clinic.com)
  sync_status TEXT CHECK (sync_status IN ('pending', 'synced', 'failed', 'not_configured')) DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,   -- Timestamp of last successful sync
  sync_error TEXT,              -- Error message if sync failed

  -- Audit / Traceability Fields (MANDATORY)
  created_by_user UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by_user UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source_of_booking TEXT CHECK (source_of_booking IN ('internal_agent', 'manual', 'receptionist', 'system')) DEFAULT 'manual',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- 7. Agent Audit Logs Table (internal AI agent actions)
CREATE TABLE agent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- authenticated user who ran the agent
  user_message TEXT NOT NULL,           -- what the user said
  interpretation JSONB,                  -- what the agent understood (function call)
  action_executed TEXT,                  -- which action was taken
  result JSONB,                          -- result of the action
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL, -- linked appointment if any
  google_sync_attempted BOOLEAN DEFAULT FALSE,
  google_sync_success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Appointment History / Audit Trail
CREATE TABLE appointment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_type TEXT CHECK (change_type IN ('created', 'confirmed', 'rescheduled', 'cancelled', 'attended', 'no_show', 'synced', 'sync_failed')) NOT NULL,
  previous_data JSONB,  -- snapshot before change
  new_data JSONB,       -- snapshot after change
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Google Calendar Sync Queue (for retry logic)
CREATE TABLE google_sync_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  operation TEXT CHECK (operation IN ('create', 'update', 'delete')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'success', 'failed')) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FAQ Knowledge Base (for internal reference / settings UI)
CREATE TABLE faq_knowledge (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Enable Row Level Security (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_knowledge ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies (authenticated clinic staff only)
-- ============================================================

-- Profiles
CREATE POLICY "Staff can read all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Patients
CREATE POLICY "Staff can read patients" ON patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create patients" ON patients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update patients" ON patients FOR UPDATE TO authenticated USING (true);

-- Professionals
CREATE POLICY "Staff can read professionals" ON professionals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage professionals" ON professionals FOR ALL TO authenticated USING (true);

-- Resources
CREATE POLICY "Staff can read resources" ON resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage resources" ON resources FOR ALL TO authenticated USING (true);

-- Appointment Types
CREATE POLICY "Staff can read appointment types" ON appointment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage appointment types" ON appointment_types FOR ALL TO authenticated USING (true);

-- Appointments (core operations)
CREATE POLICY "Staff can read appointments" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can create appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update appointments" ON appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete appointments" ON appointments FOR DELETE TO authenticated USING (true);

-- Agent Logs (audit trail - insert only from app)
CREATE POLICY "Staff can read agent logs" ON agent_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert agent logs" ON agent_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Appointment History
CREATE POLICY "Staff can read appointment history" ON appointment_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert history" ON appointment_history FOR INSERT TO authenticated WITH CHECK (true);

-- Google Sync Queue
CREATE POLICY "Staff can read sync queue" ON google_sync_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage sync queue" ON google_sync_queue FOR ALL TO authenticated USING (true);

-- FAQ
CREATE POLICY "Staff can manage FAQs" ON faq_knowledge FOR ALL TO authenticated USING (true);

-- ============================================================
-- Migration script (if upgrading from old schema)
-- Run this if appointments table already exists:
-- ============================================================
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id TEXT;
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS sync_error TEXT;
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by_user UUID REFERENCES profiles(id);
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_by_user UUID REFERENCES profiles(id);
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source_of_booking TEXT DEFAULT 'manual';
