-- Add working_hours JSONB column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}';
