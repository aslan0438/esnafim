-- ============================================================
-- RLS Policies: Public Queue Access
-- Allow anonymous read access to businesses and appointments for public queue
-- ============================================================

-- Enable RLS on all tables (already enabled, but ensuring)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read business by slug (for public queue)
DROP POLICY IF EXISTS "businesses_select_public" ON businesses;
CREATE POLICY "businesses_select_public"
  ON businesses FOR SELECT
  USING (true);

-- Policy: Allow anyone to read appointments for a business (for public queue)
DROP POLICY IF EXISTS "appointments_select_public" ON appointments;
CREATE POLICY "appointments_select_public"
  ON appointments FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert customers (for public queue walk-ins)
DROP POLICY IF EXISTS "customers_insert_public" ON customers;
CREATE POLICY "customers_insert_public"
  ON customers FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to insert appointments (for public queue walk-ins)
DROP POLICY IF EXISTS "appointments_insert_public" ON appointments;
CREATE POLICY "appointments_insert_public"
  ON appointments FOR INSERT
  WITH CHECK (true);