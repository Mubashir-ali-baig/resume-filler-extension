-- Add cover_letter_file_url column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS cover_letter_file_url TEXT;
