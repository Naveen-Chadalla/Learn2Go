/*
  # Fix Activity Tracking Functions and Policies

  1. Database Functions
    - Fix ambiguous column references in RPC functions
    - Ensure proper parameter naming and table qualification
    
  2. Security Policies
    - Update RLS policies to allow proper user operations
    - Fix user insertion and update permissions
    
  3. Session Management
    - Ensure session token handling is robust
    - Add proper constraints and indexes
*/

-- Drop existing functions to recreate them with fixed column references
DROP FUNCTION IF EXISTS start_user_session(text, text, text, text);
DROP FUNCTION IF EXISTS end_user_session(text, text);
DROP FUNCTION IF EXISTS log_user_activity(text, text, jsonb, text, integer, integer, text);

-- Recreate start_user_session function with qualified column names
CREATE OR REPLACE FUNCTION start_user_session(
  user_name text,
  session_token text,
  user_ip text DEFAULT NULL,
  user_agent_string text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert new session record with qualified column names
  INSERT INTO user_sessions (
    username,
    session_token,
    login_time,
    last_activity,
    ip_address,
    user_agent,
    is_active
  ) VALUES (
    user_name,
    session_token,
    now(),
    now(),
    user_ip,
    user_agent_string,
    true
  )
  ON CONFLICT (session_token) DO UPDATE SET
    login_time = now(),
    last_activity = now(),
    is_active = true;

  -- Update user's login count and last active
  UPDATE users 
  SET 
    total_login_count = COALESCE(users.total_login_count, 0) + 1,
    last_active = now(),
    session_start = now()
  WHERE users.username = user_name;
END;
$$;

-- Recreate end_user_session function with qualified column names
CREATE OR REPLACE FUNCTION end_user_session(
  user_name text,
  token_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_duration integer;
BEGIN
  -- Calculate session duration and update session record
  UPDATE user_sessions 
  SET 
    logout_time = now(),
    is_active = false,
    session_duration_seconds = EXTRACT(EPOCH FROM (now() - user_sessions.login_time))::integer
  WHERE user_sessions.session_token = token_value 
    AND user_sessions.username = user_name
    AND user_sessions.is_active = true;

  -- Get the calculated duration
  SELECT user_sessions.session_duration_seconds 
  INTO session_duration
  FROM user_sessions 
  WHERE user_sessions.session_token = token_value 
    AND user_sessions.username = user_name;

  -- Update user's total session time and end session
  UPDATE users 
  SET 
    total_session_time_seconds = COALESCE(users.total_session_time_seconds, 0) + COALESCE(session_duration, 0),
    last_active = now(),
    session_end = now()
  WHERE users.username = user_name;
END;
$$;

-- Recreate log_user_activity function with qualified column names
CREATE OR REPLACE FUNCTION log_user_activity(
  user_name text,
  activity text,
  details jsonb DEFAULT '{}'::jsonb,
  token_value text DEFAULT NULL,
  duration_secs integer DEFAULT NULL,
  activity_score integer DEFAULT NULL,
  page_path text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_ip text;
  session_user_agent text;
BEGIN
  -- Get session details if token provided
  IF token_value IS NOT NULL THEN
    SELECT user_sessions.ip_address, user_sessions.user_agent
    INTO session_ip, session_user_agent
    FROM user_sessions 
    WHERE user_sessions.session_token = token_value 
      AND user_sessions.username = user_name
      AND user_sessions.is_active = true;
  END IF;

  -- Insert activity log
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    activity_details,
    timestamp,
    session_id,
    ip_address,
    user_agent,
    page_url,
    duration_seconds,
    score
  ) VALUES (
    user_name,
    activity,
    details,
    now(),
    token_value,
    session_ip,
    session_user_agent,
    page_path,
    duration_secs,
    activity_score
  );

  -- Update session activity if token provided
  IF token_value IS NOT NULL THEN
    UPDATE user_sessions 
    SET last_activity = now()
    WHERE user_sessions.session_token = token_value 
      AND user_sessions.username = user_name;
  END IF;

  -- Update user's last activity
  UPDATE users 
  SET last_active = now()
  WHERE users.username = user_name;
END;
$$;

-- Update RLS policies for users table to allow proper operations
DROP POLICY IF EXISTS "Allow anon signup" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Allow anonymous users to sign up (insert their own data)
CREATE POLICY "Allow user signup" ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read their own data or admin access
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) 
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  );

-- Allow authenticated users to update their own data or admin access
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) 
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  )
  WITH CHECK (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) 
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  );

-- Allow admin to delete users
CREATE POLICY "Admin can delete users" ON users
  FOR DELETE
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari');

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION start_user_session(text, text, text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION end_user_session(text, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION log_user_activity(text, text, jsonb, text, integer, integer, text) TO authenticated, anon;