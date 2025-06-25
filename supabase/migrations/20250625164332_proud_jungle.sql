/*
  # Fix Activity Tracking Functions and Policies

  1. Database Functions
    - Fix ambiguous column reference in log_user_activity function
    - Fix session token handling in start_user_session function
    - Ensure proper parameter handling in all RPC functions

  2. Security Policies
    - Fix RLS policies for users table to allow proper updates
    - Ensure activity logging functions work correctly

  3. Function Improvements
    - Add proper error handling
    - Fix parameter naming conflicts
    - Ensure all required columns are handled properly
*/

-- Drop existing functions to recreate them with fixes
DROP FUNCTION IF EXISTS log_user_activity(text, text, jsonb, text, integer, integer, text);
DROP FUNCTION IF EXISTS start_user_session(text, text, text, text);
DROP FUNCTION IF EXISTS end_user_session(text, text);

-- Create improved log_user_activity function with fixed column references
CREATE OR REPLACE FUNCTION log_user_activity(
  user_name text,
  activity text,
  details jsonb DEFAULT '{}'::jsonb,
  token_value text DEFAULT NULL,
  duration_secs integer DEFAULT NULL,
  activity_score integer DEFAULT NULL,
  page_path text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  session_ip text;
  session_user_agent text;
BEGIN
  -- Get session details if token provided
  IF token_value IS NOT NULL THEN
    SELECT us.ip_address, us.user_agent 
    INTO session_ip, session_user_agent
    FROM user_sessions us 
    WHERE us.session_token = token_value AND us.is_active = true;
  END IF;

  -- Insert activity log
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    activity_details,
    session_id,
    ip_address,
    user_agent,
    page_url,
    duration_seconds,
    score,
    metadata
  ) VALUES (
    user_name,
    activity,
    details,
    token_value,
    session_ip,
    session_user_agent,
    page_path,
    duration_secs,
    activity_score,
    details
  );

  -- Update user's last activity
  UPDATE users 
  SET last_active = now() 
  WHERE username = user_name;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the request
    RAISE WARNING 'Failed to log activity for user %: %', user_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved start_user_session function with proper token handling
CREATE OR REPLACE FUNCTION start_user_session(
  user_name text,
  session_token text,
  user_ip text DEFAULT NULL,
  user_agent_string text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Validate inputs
  IF user_name IS NULL OR session_token IS NULL THEN
    RAISE EXCEPTION 'Username and session_token are required';
  END IF;

  -- End any existing active sessions for this user
  UPDATE user_sessions 
  SET 
    is_active = false,
    logout_time = now(),
    session_duration_seconds = EXTRACT(EPOCH FROM (now() - login_time))::integer
  WHERE username = user_name AND is_active = true;

  -- Create new session
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
  );

  -- Update user login stats
  UPDATE users 
  SET 
    last_active = now(),
    total_login_count = COALESCE(total_login_count, 0) + 1,
    session_start = now()
  WHERE username = user_name;

  -- Log login activity
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    session_id,
    ip_address,
    user_agent,
    activity_details
  ) VALUES (
    user_name,
    'login',
    session_token,
    user_ip,
    user_agent_string,
    jsonb_build_object('login_time', now())
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Session token already exists. Please try again.';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to start session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved end_user_session function
CREATE OR REPLACE FUNCTION end_user_session(
  user_name text,
  token_value text
) RETURNS void AS $$
DECLARE
  session_duration integer;
BEGIN
  -- Calculate session duration and end session
  UPDATE user_sessions 
  SET 
    is_active = false,
    logout_time = now(),
    session_duration_seconds = EXTRACT(EPOCH FROM (now() - login_time))::integer
  WHERE username = user_name 
    AND session_token = token_value 
    AND is_active = true
  RETURNING session_duration_seconds INTO session_duration;

  -- Update user session stats
  UPDATE users 
  SET 
    last_active = now(),
    session_end = now(),
    total_session_time_seconds = COALESCE(total_session_time_seconds, 0) + COALESCE(session_duration, 0)
  WHERE username = user_name;

  -- Log logout activity
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    session_id,
    duration_seconds,
    activity_details
  ) VALUES (
    user_name,
    'logout',
    token_value,
    session_duration,
    jsonb_build_object('logout_time', now(), 'session_duration', session_duration)
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to end session for user %: %', user_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS policies for users table to allow proper updates
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) 
    OR 
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  )
  WITH CHECK (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) 
    OR 
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION start_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_user_session TO authenticated;