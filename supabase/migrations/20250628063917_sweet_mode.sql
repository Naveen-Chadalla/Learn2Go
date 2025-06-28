/*
  # Fix RLS policy for user_activity_logs table

  1. Security Updates
    - Drop the existing restrictive insert policy that's causing RLS violations
    - Create a new insert policy that allows authenticated users to insert their own activity logs
    - Use the correct auth.jwt() function instead of jwt()
    - Maintain admin access for user 'Hari'

  2. Changes
    - Allow users to insert activity logs for themselves based on username or email
    - Ensure proper data isolation between users
    - Fix the RLS policy that was preventing activity logging
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Allow activity log inserts" ON user_activity_logs;

-- Create a new, properly configured insert policy for activity logs
CREATE POLICY "Users can insert own activity logs"
  ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    username = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'username'),
      (auth.jwt() ->> 'email'),
      split_part((auth.jwt() ->> 'email'), '@', 1)
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'username') = 'Hari'
  );