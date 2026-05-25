-- ============================================================
-- Trigger: Automatically create business profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Business row is now created by the Register page explicitly.
  -- This trigger is kept as a fallback for any other signup flows.
  INSERT INTO public.businesses (owner_id, name)
  VALUES (NEW.id, 'Yeni İşletme')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
