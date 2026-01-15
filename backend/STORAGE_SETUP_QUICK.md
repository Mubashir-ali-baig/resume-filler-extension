# Quick Storage Setup Guide

## ⚠️ Important: Use Dashboard, Not SQL Editor

Storage policies **cannot** be created via SQL Editor due to permission restrictions. You must use the Supabase Dashboard.

## Step-by-Step Setup

### 1. Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `user-files`
   - **Public**: ❌ **Unchecked** (must be private)
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: 
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
4. Click **"Create bucket"**

### 2. Create Storage Policies

Go to **Storage → Policies → `user-files`** → Click **"New Policy"** (repeat 4 times)

#### Policy 1: Upload Files
- **Policy name**: `Users can upload own files`
- **Allowed operation**: `INSERT`
- **Policy definition** (paste this exactly):
  ```sql
  (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```
- Click **"Review"** → **"Save policy"**

#### Policy 2: View Files
- **Policy name**: `Users can view own files`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```
- Click **"Review"** → **"Save policy"**

#### Policy 3: Update Files
- **Policy name**: `Users can update own files`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```
- Click **"Review"** → **"Save policy"**

#### Policy 4: Delete Files
- **Policy name**: `Users can delete own files`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  (bucket_id = 'user-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```
- Click **"Review"** → **"Save policy"**

### 3. Verify Setup

After creating all 4 policies, verify:
- ✅ Bucket `user-files` exists
- ✅ 4 policies are listed under the bucket
- ✅ All policies use the same definition pattern
- ✅ RLS is enabled (should be automatic)

## What This Does

- **User Isolation**: Files stored in `{userId}/resumes/` and `{userId}/cover-letters/`
- **Security**: Users can only access files in their own folder
- **Private Access**: Files are not publicly accessible
- **Signed URLs**: Temporary URLs generated for file access (1 hour expiry)

## Testing

1. Upload a file via the extension
2. Check Storage → `user-files` → your user folder
3. Verify file appears in correct folder
4. Try accessing another user's folder → Should fail

## Troubleshooting

**"Permission denied" errors:**
- Verify all 4 policies are created
- Check policy definitions match exactly
- Ensure bucket is private (not public)
- Verify user is authenticated

**"File upload failed":**
- Check bucket exists: `user-files`
- Verify file size < 10MB
- Check file type is PDF/DOCX
- Check browser console for detailed error
