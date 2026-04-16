-- First migration: Add new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';