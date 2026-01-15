# File Upload Setup Guide

## Database Migration

Run the following migration in Supabase SQL Editor:

```sql
-- Add cover_letter_file_url column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS cover_letter_file_url TEXT;
```

## Storage Setup

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `user-files`
4. **Public**: ❌ **Unchecked** (Private bucket for security)
5. Click "Create bucket"

### Step 2: Create Storage Policies (via Dashboard)

**Important**: Storage policies cannot be created via SQL Editor due to permissions. Use the Dashboard:

1. Go to **Storage → Policies → `user-files` bucket**
2. Click **"New Policy"** for each policy below:

#### Policy 1: Upload Files
- **Policy name**: `Users can upload own files`
- **Allowed operation**: `INSERT`
- **Policy definition**:
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

### Step 3: Verify Storage Policies

After running the migration, verify in Supabase Dashboard:
- Storage → Policies → `user-files` bucket
- Should see 4 policies:
  - Users can upload own files
  - Users can view own files
  - Users can update own files
  - Users can delete own files

## How It Works

### File Storage Structure

```
user-files/
  ├── {user-id-1}/
  │   ├── resumes/
  │   │   └── resume_1234567890_filename.pdf
  │   └── cover-letters/
  │       └── coverletter_1234567890_filename.pdf
  ├── {user-id-2}/
  │   └── ...
```

### Security

- **User Isolation**: Files stored in `{userId}/` folder
- **RLS Policies**: Users can only access files in their own folder
- **Private Bucket**: Files not publicly accessible
- **Signed URLs**: Temporary signed URLs generated for file access (1 hour expiry)

### File Access Flow

1. User uploads file → Stored in `{userId}/resumes/` or `{userId}/cover-letters/`
2. File path stored in database (e.g., `{userId}/resumes/resume_123.pdf`)
3. When needed, generate signed URL for access
4. Signed URL expires after 1 hour

## Testing

1. **Upload Resume:**
   - Open extension → Sign in
   - Click profile button
   - Select PDF/DOCX file for resume
   - Click "Save Profile"
   - Check Supabase Storage → `user-files` → your user folder

2. **Upload Cover Letter:**
   - Same process for cover letter

3. **Verify Security:**
   - Try accessing another user's file path → Should fail
   - Check RLS policies are working

## Troubleshooting

**"File upload failed"**
- Check storage bucket exists: `user-files`
- Verify RLS policies are created
- Check file size (max 10MB)
- Check file type (PDF/DOCX only)

**"Permission denied"**
- Verify user is authenticated
- Check RLS policies are enabled
- Verify file path matches user ID

**"Signed URL generation failed"**
- Check file path is correct
- Verify file exists in storage
- Check user has access to the file

## File Size Limits

- **Max file size**: 10MB (enforced in extension)
- **Supabase limit**: 50MB per file (free tier)
- **Supported formats**: PDF, DOC, DOCX
