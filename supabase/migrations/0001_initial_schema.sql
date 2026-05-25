-- ============================================================
-- Esnafım — Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- businesses
-- ============================================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  opening_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE businesses IS 'Her kullanıcının işletme profili';

-- ============================================================
-- services
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 30,
  category TEXT NOT NULL DEFAULT 'service' CHECK (category IN ('service', 'product')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- customers
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, phone)
);

-- ============================================================
-- appointments
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- orders
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'ready', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: get current user's business_id
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_business_id()
RETURNS UUID AS $$
DECLARE
  biz_id UUID;
BEGIN
  SELECT id INTO biz_id FROM businesses WHERE owner_id = auth.uid();
  RETURN biz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS Policies: businesses
-- ============================================================
CREATE POLICY "businesses_select_own"
  ON businesses FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "businesses_insert_own"
  ON businesses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "businesses_update_own"
  ON businesses FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================================
-- RLS Policies: services
-- ============================================================
CREATE POLICY "services_select_own"
  ON services FOR SELECT
  USING (business_id = get_current_business_id());

CREATE POLICY "services_insert_own"
  ON services FOR INSERT
  WITH CHECK (business_id = get_current_business_id());

CREATE POLICY "services_update_own"
  ON services FOR UPDATE
  USING (business_id = get_current_business_id());

CREATE POLICY "services_delete_own"
  ON services FOR DELETE
  USING (business_id = get_current_business_id());

-- ============================================================
-- RLS Policies: customers
-- ============================================================
CREATE POLICY "customers_select_own"
  ON customers FOR SELECT
  USING (business_id = get_current_business_id());

CREATE POLICY "customers_insert_own"
  ON customers FOR INSERT
  WITH CHECK (business_id = get_current_business_id());

CREATE POLICY "customers_update_own"
  ON customers FOR UPDATE
  USING (business_id = get_current_business_id());

CREATE POLICY "customers_delete_own"
  ON customers FOR DELETE
  USING (business_id = get_current_business_id());

-- ============================================================
-- RLS Policies: appointments
-- ============================================================
CREATE POLICY "appointments_select_own"
  ON appointments FOR SELECT
  USING (business_id = get_current_business_id());

CREATE POLICY "appointments_insert_own"
  ON appointments FOR INSERT
  WITH CHECK (business_id = get_current_business_id());

CREATE POLICY "appointments_update_own"
  ON appointments FOR UPDATE
  USING (business_id = get_current_business_id());

CREATE POLICY "appointments_delete_own"
  ON appointments FOR DELETE
  USING (business_id = get_current_business_id());

-- ============================================================
-- RLS Policies: orders
-- ============================================================
CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (business_id = get_current_business_id());

CREATE POLICY "orders_insert_own"
  ON orders FOR INSERT
  WITH CHECK (business_id = get_current_business_id());

CREATE POLICY "orders_update_own"
  ON orders FOR UPDATE
  USING (business_id = get_current_business_id());

CREATE POLICY "orders_delete_own"
  ON orders FOR DELETE
  USING (business_id = get_current_business_id());

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_customers_business ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_appointments_business_date ON appointments(business_id, appointment_date);
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_status ON orders(status);
