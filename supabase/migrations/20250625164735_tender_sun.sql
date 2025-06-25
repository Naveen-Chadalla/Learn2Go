/*
  # Fix Activity Tracking and RLS Policy Errors

  1. Database Functions
    - Fix ambiguous column references in log_user_activity and start_user_session functions
    - Add proper error handling and validation
    - Ensure all column references are properly qualified

  2. RLS Policies
    - Add missing INSERT and UPDATE policies for users table
    - Ensure authenticated users can manage their own data

  3. Session Management
    - Improve session token handling
    - Add proper constraints and indexes
*/

-- First, drop existing functions to recreate them with fixes
DROP FUNCTION IF EXISTS log_user_activity(text, text, jsonb, text, integer, integer, text);
DROP FUNCTION IF EXISTS start_user_session(text, text, text, text);
DROP FUNCTION IF EXISTS end_user_session(text, text);

-- Create improved log_user_activity function with proper column qualification
CREATE OR REPLACE FUNCTION log_user_activity(
  user_name text,
  activity text,
  details jsonb DEFAULT '{}',
  token_value text DEFAULT NULL,
  duration_secs integer DEFAULT NULL,
  activity_score integer DEFAULT NULL,
  page_path text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  session_info record;
BEGIN
  -- Get session information if token provided
  IF token_value IS NOT NULL THEN
    SELECT 
      us.ip_address,
      us.user_agent,
      us.id as session_id
    INTO session_info
    FROM user_sessions us
    WHERE us.session_token = token_value 
      AND us.username = user_name 
      AND us.is_active = true;
  END IF;

  -- Insert activity log with proper column references
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
    score,
    metadata
  ) VALUES (
    user_name,
    activity,
    details,
    now(),
    COALESCE(session_info.session_id::text, token_value),
    session_info.ip_address,
    session_info.user_agent,
    page_path,
    duration_secs,
    activity_score,
    jsonb_build_object(
      'logged_at', now(),
      'has_session', (session_info IS NOT NULL)
    )
  );

  -- Update user's last activity
  UPDATE users 
  SET last_active = now()
  WHERE username = user_name;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the entire operation
    RAISE WARNING 'Error in log_user_activity: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved start_user_session function
CREATE OR REPLACE FUNCTION start_user_session(
  user_name text,
  session_token text,
  user_ip text DEFAULT NULL,
  user_agent_string text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  session_id uuid;
  existing_session record;
BEGIN
  -- Validate inputs
  IF user_name IS NULL OR session_token IS NULL THEN
    RAISE EXCEPTION 'Username and session token are required';
  END IF;

  -- Check for existing active session with same token
  SELECT us.id, us.username
  INTO existing_session
  FROM user_sessions us
  WHERE us.session_token = session_token;

  -- If session exists with same user, reactivate it
  IF existing_session.id IS NOT NULL THEN
    IF existing_session.username = user_name THEN
      UPDATE user_sessions 
      SET 
        is_active = true,
        last_activity = now(),
        login_time = CASE WHEN NOT is_active THEN now() ELSE login_time END
      WHERE id = existing_session.id;
      
      RETURN existing_session.id;
    ELSE
      -- Token exists for different user - this shouldn't happen
      RAISE EXCEPTION 'Session token conflict detected';
    END IF;
  END IF;

  -- Deactivate any existing active sessions for this user
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
    is_active,
    pages_visited,
    lessons_completed,
    quizzes_taken,
    games_played
  ) VALUES (
    user_name,
    session_token,
    now(),
    now(),
    user_ip,
    user_agent_string,
    true,
    0,
    0,
    0,
    0
  ) RETURNING id INTO session_id;

  -- Update user login statistics
  UPDATE users 
  SET 
    last_active = now(),
    total_login_count = COALESCE(total_login_count, 0) + 1,
    session_start = now()
  WHERE username = user_name;

  RETURN session_id;

EXCEPTION
  WHEN unique_violation THEN
    -- Handle duplicate session token
    RAISE EXCEPTION 'Session token already exists: %', session_token;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error starting session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create improved end_user_session function
CREATE OR REPLACE FUNCTION end_user_session(
  user_name text,
  token_value text
) RETURNS void AS $$
DECLARE
  session_record record;
BEGIN
  -- Find and update the session
  SELECT us.id, us.login_time
  INTO session_record
  FROM user_sessions us
  WHERE us.session_token = token_value 
    AND us.username = user_name 
    AND us.is_active = true;

  IF session_record.id IS NOT NULL THEN
    -- Calculate session duration
    UPDATE user_sessions 
    SET 
      is_active = false,
      logout_time = now(),
      session_duration_seconds = EXTRACT(EPOCH FROM (now() - session_record.login_time))::integer
    WHERE id = session_record.id;

    -- Update user session statistics
    UPDATE users 
    SET 
      session_end = now(),
      total_session_time_seconds = COALESCE(total_session_time_seconds, 0) + 
        EXTRACT(EPOCH FROM (now() - session_record.login_time))::integer
    WHERE username = user_name;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error ending session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix RLS policies for users table
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anon signup" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (
    -- Allow if username matches JWT claim or user is admin
    (username = COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'username',
      current_setting('request.jwt.claims', true)::json ->> 'username'
    )) OR 
    (COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'username',
      current_setting('request.jwt.claims', true)::json ->> 'username'
    ) = 'Hari')
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  TO authenticated
  USING (
    -- Allow if username matches JWT claim or user is admin
    (username = COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'username',
      current_setting('request.jwt.claims', true)::json ->> 'username'
    )) OR 
    (COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'username',
      current_setting('request.jwt.claims', true)::json ->> 'username'
    ) = 'Hari')
  )
  WITH CHECK (
    -- Ensure updated data still belongs to same user
    (username = COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'username',
      current_setting('request.jwt.claims', true)::json ->> 'username'
    )) OR 
    (COALESCE(
      (current_setting('request.jwt.claims', true)::json ->> 'user_metadata')::json ->> 'username',
      current_setting('request.jwt.claims', true)::json ->> 'username'
    ) = 'Hari')
  );

-- Allow anonymous users to insert during signup
CREATE POLICY "Allow anonymous signup" ON users
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Grant necessary permissions to functions
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated, anon;
GRANT EXECUTE ON FUNCTION start_user_session TO authenticated, anon;
GRANT EXECUTE ON FUNCTION end_user_session TO authenticated, anon;

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_username_active 
  ON user_sessions (username, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_sessions_token_active 
  ON user_sessions (session_token, is_active) 
  WHERE is_active = true;

-- Add constraint to prevent too many active sessions per user
CREATE OR REPLACE FUNCTION check_max_active_sessions() 
RETURNS TRIGGER AS $$
BEGIN
  -- Limit to 5 active sessions per user
  IF (SELECT COUNT(*) FROM user_sessions 
      WHERE username = NEW.username AND is_active = true) > 5 THEN
    -- Deactivate oldest session
    UPDATE user_sessions 
    SET is_active = false, logout_time = now()
    WHERE id = (
      SELECT id FROM user_sessions 
      WHERE username = NEW.username AND is_active = true 
      ORDER BY login_time ASC 
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session limit
DROP TRIGGER IF EXISTS trigger_check_max_sessions ON user_sessions;
CREATE TRIGGER trigger_check_max_sessions
  AFTER INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_max_active_sessions();