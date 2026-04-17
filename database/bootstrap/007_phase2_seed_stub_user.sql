-- Phase 2 seed for stub auth user
-- Ensures auth.uid() stub has matching rows in auth.users, profiles, and user_roles

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'local-admin@accredicore.local',
  '{"full_name":"Local Admin"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'local-admin@accredicore.local',
  'Local Admin'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'system_admin'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.mfa_configurations (user_id, is_mfa_enabled)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  false
)
ON CONFLICT (user_id) DO NOTHING;