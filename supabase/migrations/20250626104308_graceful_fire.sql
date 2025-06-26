/*
  # Fix User Progress RLS Policy

  1. Security Updates
    - Update RLS policy for user_progress table to properly handle authentication
    - Allow users to manage their own progress based on email or username
    - Ensure compatibility with Supabase Auth JWT structure

  2. Changes
    - Drop existing policy that's causing issues
    - Create new policy that checks both email and username fields
    - Handle cases where username might be derived from email
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can manage own progress" ON user_progress;

-- Create a new comprehensive policy for user progress management
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL
  TO authenticated
  USING (
    -- Allow if username matches the authenticated user's username from user_metadata
    username = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'username'),
      -- Fallback to email if username not set
      (auth.jwt() ->> 'email')
    )
    OR
    -- Allow if username matches email directly
    username = (auth.jwt() ->> 'email')
    OR
    -- Allow if email matches (for cases where username is email)
    username = SPLIT_PART((auth.jwt() ->> 'email'), '@', 1)
    OR
    -- Admin override (keep existing admin access)
    (auth.jwt() -> 'user_metadata' ->> 'username') = 'Hari'
  )
  WITH CHECK (
    -- Same conditions for INSERT/UPDATE operations
    username = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'username'),
      (auth.jwt() ->> 'email')
    )
    OR
    username = (auth.jwt() ->> 'email')
    OR
    username = SPLIT_PART((auth.jwt() ->> 'email'), '@', 1)
    OR
    (auth.jwt() -> 'user_metadata' ->> 'username') = 'Hari'
  );