/*
  # Fix Activity Tracker Database Functions and RLS

  1. Database Functions
    - Drop existing functions that may have parameter conflicts
    - Create start_user_session function for session management
    - Create end_user_session function with proper parameter naming
    - Create log_user_activity function for activity logging

  2. Security
    - Update RLS policies for user_activity_logs table
    - Grant proper permissions to authenticated users
    - Use SECURITY DEFINER for elevated privileges where needed

  3. Activity Tracking
    - Support for session management
    - Activity logging with proper user context
    - Automatic counter updates for user statistics
*/

-- Drop existing functions to avoid parameter conflicts
DROP FUNCTION IF EXISTS start_user_session(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS end_user_session(TEXT, TEXT);
DROP FUNCTION IF EXISTS log_user_activity(TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, TEXT);

-- Function to start a user session
CREATE OR REPLACE FUNCTION start_user_session(
  user_name TEXT,
  session_token TEXT,
  user_ip TEXT DEFAULT NULL,
  user_agent_string TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
BEGIN
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
    NOW(),
    NOW(),
    user_ip,
    user_agent_string,
    true
  ) RETURNING id INTO session_id;

  -- Update user's login count and last active
  UPDATE users 
  SET 
    total_login_count = COALESCE(total_login_count, 0) + 1,
    last_active = NOW(),
    session_start = NOW()
  WHERE username = user_name;

  RETURN session_id;
END;
$$;

-- Function to end a user session
CREATE OR REPLACE FUNCTION end_user_session(
  user_name TEXT,
  token_value TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_start_time TIMESTAMPTZ;
  session_duration INTEGER;
BEGIN
  -- Get session start time
  SELECT login_time INTO session_start_time
  FROM user_sessions 
  WHERE username = user_name AND session_token = token_value AND is_active = true;

  -- Calculate duration in seconds
  session_duration := EXTRACT(EPOCH FROM (NOW() - session_start_time))::INTEGER;

  -- Update session record
  UPDATE user_sessions 
  SET 
    logout_time = NOW(),
    is_active = false,
    session_duration_seconds = session_duration
  WHERE username = user_name AND session_token = token_value;

  -- Update user's total session time and set session end
  UPDATE users 
  SET 
    total_session_time_seconds = COALESCE(total_session_time_seconds, 0) + COALESCE(session_duration, 0),
    last_active = NOW(),
    session_end = NOW()
  WHERE username = user_name;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_name TEXT,
  activity TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  token_value TEXT DEFAULT NULL,
  duration_secs INTEGER DEFAULT NULL,
  activity_score INTEGER DEFAULT NULL,
  page_path TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  user_ip TEXT;
  user_agent TEXT;
BEGIN
  -- Get session info if token_value provided
  IF token_value IS NOT NULL THEN
    SELECT ip_address, user_agent 
    INTO user_ip, user_agent
    FROM user_sessions 
    WHERE session_token = token_value AND is_active = true
    LIMIT 1;
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
    NOW(),
    token_value,
    user_ip,
    user_agent,
    page_path,
    duration_secs,
    activity_score
  ) RETURNING id INTO activity_id;

  -- Update user's last activity
  UPDATE users 
  SET last_active = NOW()
  WHERE username = user_name;

  -- Update specific counters based on activity type
  CASE activity
    WHEN 'quiz_attempt' THEN
      UPDATE users 
      SET total_quiz_attempts = COALESCE(total_quiz_attempts, 0) + 1
      WHERE username = user_name;
    
    WHEN 'quiz_complete' THEN
      UPDATE users 
      SET 
        best_quiz_score = GREATEST(COALESCE(best_quiz_score, 0), COALESCE(activity_score, 0)),
        average_quiz_score = (
          SELECT AVG(score)::NUMERIC(5,2)
          FROM user_activity_logs 
          WHERE username = user_name AND activity_type = 'quiz_complete' AND score IS NOT NULL
        )
      WHERE username = user_name;
    
    WHEN 'game_play' THEN
      UPDATE users 
      SET total_games_played = COALESCE(total_games_played, 0) + 1
      WHERE username = user_name;
    
    ELSE
      -- No specific counter update needed
  END CASE;

  RETURN activity_id;
END;
$$;

-- Update RLS policies for user_activity_logs to work with the function
DROP POLICY IF EXISTS "System can insert activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "Users can view own activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "Admin can manage all activity logs" ON user_activity_logs;

-- Allow the function to insert activity logs (SECURITY DEFINER bypasses RLS)
CREATE POLICY "Allow function inserts" ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text)
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  );

-- Admin can manage all activity logs
CREATE POLICY "Admin can manage all activity logs" ON user_activity_logs
  FOR ALL
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari')
  WITH CHECK (((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari');

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION start_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;