-- Manual Storage Setup Instructions
-- 
-- Due to Supabase permissions, storage policies must be set up via the Dashboard
-- Follow these steps:

-- STEP 1: Create Storage Bucket
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: user-files
-- 4. Public: ❌ Unchecked (Private)
-- 5. File size limit: 10MB (10485760 bytes)
-- 6. Allowed MIME types: 
--    - application/pdf
--    - application/msword
--    - application/vnd.openxmlformats-officedocument.wordprocessingml.document
-- 7. Click "Create bucket"

-- STEP 2: Create Storage Policies
-- Go to Storage → Policies → user-files → New Policy

-- Policy 1: Upload Files
-- Name: Users can upload own files
-- Allowed operation: INSERT
-- Policy definition:
(bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Policy 2: View Files
-- Name: Users can view own files
-- Allowed operation: SELECT
-- Policy definition:
(bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Policy 3: Update Files
-- Name: Users can update own files
-- Allowed operation: UPDATE
-- Policy definition:
(bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Policy 4: Delete Files
-- Name: Users can delete own files
-- Allowed operation: DELETE
-- Policy definition:
(bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)

-- STEP 3: Verify
-- After creating policies, verify:
-- - 4 policies exist for user-files bucket
-- - All policies use the same definition pattern
-- - RLS is enabled on the bucket
