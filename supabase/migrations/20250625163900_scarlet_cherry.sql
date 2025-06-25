/*
  # Fix Activity Tracking Database Errors

  1. Database Functions
    - Create `start_user_session` function to handle session creation with proper token generation
    - Create `log_user_activity` function to handle activity logging without column ambiguity
    - Create `end_user_session` function to properly close sessions

  2. Security Policies
    - Update users table RLS policies to allow proper INSERT/UPDATE operations
    - Add policies for user_sessions and user_activity_logs tables

  3. Fixes
    - Resolve ambiguous column references in functions
    - Ensure session_token is properly generated
    - Allow authenticated users to create and update their profiles
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS start_user_session(text, text, text);
DROP FUNCTION IF EXISTS log_user_activity(text, text, jsonb, text, text, text, text, integer, integer, jsonb);
DROP FUNCTION IF EXISTS end_user_session(text);

-- Create function to start user session
CREATE OR REPLACE FUNCTION start_user_session(
  p_username text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
  session_token text;
BEGIN
  -- Generate session ID and token
  session_id := gen_random_uuid();
  session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert new session
  INSERT INTO user_sessions (
    id,
    username,
    session_token,
    login_time,
    last_activity,
    ip_address,
    user_agent,
    is_active
  ) VALUES (
    session_id,
    p_username,
    session_token,
    now(),
    now(),
    p_ip_address,
    p_user_agent,
    true
  );
  
  -- Update user's last_active and session info
  UPDATE users 
  SET 
    last_active = now(),
    session_start = now(),
    total_login_count = total_login_count + 1
  WHERE username = p_username;
  
  RETURN session_id;
END;
$$;

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_username text,
  p_activity_type text,
  p_activity_details jsonb DEFAULT '{}',
  p_session_id text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_page_url text DEFAULT NULL,
  p_duration_seconds integer DEFAULT NULL,
  p_score integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id uuid;
BEGIN
  -- Generate activity ID
  activity_id := gen_random_uuid();
  
  -- Insert activity log
  INSERT INTO user_activity_logs (
    id,
    username,
    activity_type,
    activity_details,
    timestamp,
    session_id,
    ip_address,
    user_agent,
    page_url,
    duration_seconds,
    score,
    metadata
  ) VALUES (
    activity_id,
    p_username,
    p_activity_type,
    p_activity_details,
    now(),
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_page_url,
    p_duration_seconds,
    p_score,
    p_metadata
  );
  
  -- Update user's last_activity
  UPDATE users 
  SET last_active = now()
  WHERE username = p_username;
  
  RETURN activity_id;
END;
$$;

-- Create function to end user session
CREATE OR REPLACE FUNCTION end_user_session(
  p_session_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_username text;
  session_start_time timestamptz;
  calculated_duration integer;
BEGIN
  -- Get session info
  SELECT username, login_time 
  INTO session_username, session_start_time
  FROM user_sessions 
  WHERE id::text = p_session_id AND is_active = true;
  
  IF session_username IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate session duration
  calculated_duration := EXTRACT(EPOCH FROM (now() - session_start_time))::integer;
  
  -- Update session
  UPDATE user_sessions 
  SET 
    logout_time = now(),
    is_active = false,
    session_duration_seconds = calculated_duration,
    last_activity = now()
  WHERE id::text = p_session_id;
  
  -- Update user's session info
  UPDATE users 
  SET 
    session_end = now(),
    total_session_time_seconds = total_session_time_seconds + calculated_duration,
    last_active = now()
  WHERE username = session_username;
  
  RETURN true;
END;
$$;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Allow users to insert their own data (for signup)
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    username = ((current_setting('request.jwt.claims', true))::json ->> 'username') OR
    ((current_setting('request.jwt.claims', true))::json ->> 'username') = 'Hari'
  );

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims', true))::json ->> 'username') OR
    ((current_setting('request.jwt.claims', true))::json ->> 'username') = 'Hari'
  )
  WITH CHECK (
    username = ((current_setting('request.jwt.claims', true))::json ->> 'username') OR
    ((current_setting('request.jwt.claims', true))::json ->> 'username') = 'Hari'
  );

-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims', true))::json ->> 'username') OR
    ((current_setting('request.jwt.claims', true))::json ->> 'username') = 'Hari'
  );

-- Also allow anon users to insert (for initial signup)
CREATE POLICY "Allow anon signup" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION start_user_session(text, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_user_activity(text, text, jsonb, text, text, text, text, integer, integer, jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION end_user_session(text) TO authenticated, anon;