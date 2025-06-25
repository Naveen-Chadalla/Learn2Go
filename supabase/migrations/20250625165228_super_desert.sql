/*
  # Fix Activity Tracking Functions and RLS Policies

  1. Database Functions
    - Creates new activity tracking functions with unique names
    - Drops all existing conflicting functions
    - Adds proper error handling and validation

  2. Security
    - Updates RLS policies for users, user_sessions, and user_activity_logs tables
    - Ensures proper access control for authenticated users and admin
    - Grants necessary permissions
*/

-- Drop all existing functions that might conflict (using CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS log_user_activity CASCADE;
DROP FUNCTION IF EXISTS start_user_session CASCADE;
DROP FUNCTION IF EXISTS end_user_session CASCADE;

-- Also try to drop with specific signatures to be thorough
DO $$
BEGIN
    -- Try to drop various possible signatures
    EXECUTE 'DROP FUNCTION IF EXISTS log_user_activity(text, text, jsonb, text, integer, integer, text) CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS start_user_session(text, text, text, text) CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS end_user_session(text, text) CASCADE';
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if functions don't exist
        NULL;
END $$;

-- Create the session management function with a new unique name
CREATE FUNCTION create_user_session(
  user_name text,
  session_token text,
  user_ip text DEFAULT NULL,
  user_agent_string text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Validate required parameters
  IF user_name IS NULL OR user_name = '' THEN
    RAISE EXCEPTION 'Failed to start session: Username is required';
  END IF;
  
  IF session_token IS NULL OR session_token = '' THEN
    RAISE EXCEPTION 'Failed to start session: Session token is required';
  END IF;

  -- End any existing active sessions for this user first
  UPDATE user_sessions 
  SET 
    is_active = false,
    logout_time = now(),
    session_duration_seconds = EXTRACT(EPOCH FROM (now() - login_time))::integer
  WHERE username = user_name AND is_active = true;

  -- Insert new session record
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

  -- Update user's login count and last active time
  UPDATE users 
  SET 
    total_login_count = COALESCE(total_login_count, 0) + 1,
    last_active = now(),
    session_start = now()
  WHERE username = user_name;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Failed to start session: Session token already exists';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to start session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the session termination function with a new unique name
CREATE FUNCTION terminate_user_session(
  user_name text,
  token_value text
) RETURNS void AS $$
DECLARE
  session_duration integer;
BEGIN
  -- Validate required parameters
  IF user_name IS NULL OR user_name = '' THEN
    RAISE EXCEPTION 'Failed to end session: Username is required';
  END IF;
  
  IF token_value IS NULL OR token_value = '' THEN
    RAISE EXCEPTION 'Failed to end session: Session token is required';
  END IF;

  -- Calculate session duration and update session record
  UPDATE user_sessions 
  SET 
    logout_time = now(),
    is_active = false,
    session_duration_seconds = EXTRACT(EPOCH FROM (now() - login_time))::integer
  WHERE username = user_name 
    AND session_token = token_value 
    AND is_active = true;

  -- Update user's session end time and total session time
  SELECT EXTRACT(EPOCH FROM (now() - session_start))::integer INTO session_duration
  FROM users 
  WHERE username = user_name AND session_start IS NOT NULL;

  UPDATE users 
  SET 
    session_end = now(),
    total_session_time_seconds = COALESCE(total_session_time_seconds, 0) + COALESCE(session_duration, 0),
    last_active = now()
  WHERE username = user_name;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to end session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the activity logging function with a new unique name
CREATE FUNCTION record_user_activity(
  user_name text,
  activity text,
  details jsonb DEFAULT '{}'::jsonb,
  token_value text DEFAULT NULL,
  duration_secs integer DEFAULT NULL,
  activity_score integer DEFAULT NULL,
  page_path text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Validate required parameters
  IF user_name IS NULL OR user_name = '' THEN
    RAISE EXCEPTION 'Failed to log activity: Username is required';
  END IF;
  
  IF activity IS NULL OR activity = '' THEN
    RAISE EXCEPTION 'Failed to log activity: Activity type is required';
  END IF;

  -- Insert activity log
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    activity_details,
    timestamp,
    session_id,
    duration_seconds,
    score,
    page_url,
    metadata
  ) VALUES (
    user_name,
    activity,
    details,
    now(),
    token_value,
    duration_secs,
    activity_score,
    page_path,
    details
  );

  -- Update user's last activity time
  UPDATE users 
  SET last_active = now()
  WHERE username = user_name;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to log activity: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create wrapper functions with the original names for backward compatibility
CREATE FUNCTION start_user_session(
  user_name text,
  session_token text,
  user_ip text DEFAULT NULL,
  user_agent_string text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  PERFORM create_user_session(user_name, session_token, user_ip, user_agent_string);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION end_user_session(
  user_name text,
  token_value text
) RETURNS void AS $$
BEGIN
  PERFORM terminate_user_session(user_name, token_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION log_user_activity(
  user_name text,
  activity text,
  details jsonb DEFAULT '{}'::jsonb,
  token_value text DEFAULT NULL,
  duration_secs integer DEFAULT NULL,
  activity_score integer DEFAULT NULL,
  page_path text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  PERFORM record_user_activity(user_name, activity, details, token_value, duration_secs, activity_score, page_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for users table to fix access issues
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anon signup" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;

-- Create improved RLS policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR 
    email = auth.jwt() ->> 'email' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  );

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR 
    email = auth.jwt() ->> 'email' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR 
    email = auth.jwt() ->> 'email' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  )
  WITH CHECK (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR 
    email = auth.jwt() ->> 'email' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  );

CREATE POLICY "Allow anon signup" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admin can delete users" ON users
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari');

-- Ensure proper policies for user_sessions table
DROP POLICY IF EXISTS "System can manage sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;

CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL
  TO authenticated
  USING (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  )
  WITH CHECK (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  );

-- Ensure proper policies for user_activity_logs table
DROP POLICY IF EXISTS "Users can view own activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "Allow function inserts" ON user_activity_logs;
DROP POLICY IF EXISTS "Allow activity log inserts" ON user_activity_logs;
DROP POLICY IF EXISTS "Admin can manage all activity logs" ON user_activity_logs;

CREATE POLICY "Users can view own activity logs" ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  );

CREATE POLICY "Allow activity log inserts" ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    username = COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username',
      auth.jwt() ->> 'email'
    ) OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari'
  );

CREATE POLICY "Admin can manage all activity logs" ON user_activity_logs
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari')
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'username' = 'Hari');

-- Grant necessary permissions to authenticated users for all functions
GRANT EXECUTE ON FUNCTION create_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION terminate_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION record_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION start_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;