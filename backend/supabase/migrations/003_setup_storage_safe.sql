-- Safe Storage Setup (for when policies are already created via Dashboard)
-- 
-- This migration only creates the bucket if it doesn't exist
-- Policies should be created via Dashboard (Storage → Policies)

-- Create storage bucket (safe - won't error if bucket exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS and policies are managed via Dashboard
-- If you created policies via Dashboard, you don't need to run the policy creation SQL
-- The bucket creation above is safe to run (won't duplicate)
