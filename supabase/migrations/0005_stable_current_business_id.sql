-- Keep RLS business resolution stable if a user accidentally has multiple business rows.
CREATE OR REPLACE FUNCTION get_current_business_id()
RETURNS UUID AS $$
DECLARE
  biz_id UUID;
BEGIN
  SELECT id
    INTO biz_id
    FROM businesses
   WHERE owner_id = auth.uid()
   ORDER BY created_at ASC, id ASC
   LIMIT 1;

  RETURN biz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
