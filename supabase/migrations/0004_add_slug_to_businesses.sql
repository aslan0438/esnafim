-- Add slug column to businesses table for public queue pages
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
