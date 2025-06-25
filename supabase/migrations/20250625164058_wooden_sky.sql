/*
  # Fix Activity Tracking Functions and RLS Policies

  1. Database Functions
    - Create/fix `start_user_session` function with proper parameter handling
    - Create/fix `end_user_session` function 
    - Create/fix `log_user_activity` function with unambiguous column references
  
  2. Security Updates
    - Fix RLS policies for users table to allow proper updates
    - Ensure authenticated users can update their own data
  
  3. Bug Fixes
    - Resolve ambiguous column reference issues
    - Fix null constraint violations
    - Ensure proper parameter passing
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS start_user_session(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS end_user_session(TEXT, TEXT);
DROP FUNCTION IF EXISTS log_user_activity(TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, TEXT);

-- Create start_user_session function
CREATE OR REPLACE FUNCTION start_user_session(
  user_name TEXT,
  session_token TEXT,
  user_ip TEXT DEFAULT NULL,
  user_agent_string TEXT DEFAULT NULL
)
RETURNS UUID
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
  
  -- Log the login activity
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    activity_details,
    session_id,
    ip_address,
    user_agent
  ) VALUES (
    user_name,
    'login',
    jsonb_build_object(
      'login_time', NOW(),
      'session_token', session_token
    ),
    session_token,
    user_ip,
    user_agent_string
  );
  
  RETURN session_id;
END;
$$;

-- Create end_user_session function
CREATE OR REPLACE FUNCTION end_user_session(
  user_name TEXT,
  token_value TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_duration INTEGER;
  session_start_time TIMESTAMPTZ;
BEGIN
  -- Get session start time and calculate duration
  SELECT login_time INTO session_start_time
  FROM user_sessions 
  WHERE username = user_name AND session_token = token_value AND is_active = true;
  
  IF session_start_time IS NOT NULL THEN
    session_duration := EXTRACT(EPOCH FROM (NOW() - session_start_time))::INTEGER;
    
    -- Update session record
    UPDATE user_sessions 
    SET 
      logout_time = NOW(),
      is_active = false,
      session_duration_seconds = session_duration,
      last_activity = NOW()
    WHERE username = user_name AND session_token = token_value;
    
    -- Update user's total session time and last active
    UPDATE users 
    SET 
      total_session_time_seconds = COALESCE(total_session_time_seconds, 0) + session_duration,
      last_active = NOW(),
      session_end = NOW()
    WHERE username = user_name;
    
    -- Log the logout activity
    INSERT INTO user_activity_logs (
      username,
      activity_type,
      activity_details,
      session_id,
      duration_seconds
    ) VALUES (
      user_name,
      'logout',
      jsonb_build_object(
        'logout_time', NOW(),
        'session_duration', session_duration
      ),
      token_value,
      session_duration
    );
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create log_user_activity function with unambiguous column references
CREATE OR REPLACE FUNCTION log_user_activity(
  user_name TEXT,
  activity TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  token_value TEXT DEFAULT NULL,
  duration_secs INTEGER DEFAULT NULL,
  activity_score INTEGER DEFAULT NULL,
  page_path TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  current_ip TEXT;
  current_user_agent TEXT;
BEGIN
  -- Get IP and user agent from current session if available
  SELECT 
    user_sessions.ip_address,
    user_sessions.user_agent
  INTO 
    current_ip,
    current_user_agent
  FROM user_sessions 
  WHERE user_sessions.username = user_name 
    AND user_sessions.session_token = token_value 
    AND user_sessions.is_active = true
  LIMIT 1;
  
  -- Insert activity log with explicit table qualification
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    activity_details,
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
    token_value,
    current_ip,
    current_user_agent,
    page_path,
    duration_secs,
    activity_score
  ) RETURNING id INTO activity_id;
  
  -- Update session activity counters if session exists
  IF token_value IS NOT NULL THEN
    UPDATE user_sessions 
    SET 
      last_activity = NOW(),
      pages_visited = CASE 
        WHEN activity = 'page_view' THEN COALESCE(pages_visited, 0) + 1
        ELSE pages_visited
      END,
      lessons_completed = CASE 
        WHEN activity = 'lesson_complete' THEN COALESCE(lessons_completed, 0) + 1
        ELSE lessons_completed
      END,
      quizzes_taken = CASE 
        WHEN activity = 'quiz_complete' THEN COALESCE(quizzes_taken, 0) + 1
        ELSE quizzes_taken
      END,
      games_played = CASE 
        WHEN activity = 'game_play' THEN COALESCE(games_played, 0) + 1
        ELSE games_played
      END
    WHERE username = user_name AND session_token = token_value;
  END IF;
  
  -- Update user activity counters
  UPDATE users 
  SET 
    last_active = NOW(),
    total_quiz_attempts = CASE 
      WHEN activity IN ('quiz_attempt', 'quiz_complete') THEN COALESCE(total_quiz_attempts, 0) + 1
      ELSE total_quiz_attempts
    END,
    total_games_played = CASE 
      WHEN activity = 'game_play' THEN COALESCE(total_games_played, 0) + 1
      ELSE total_games_played
    END,
    average_quiz_score = CASE 
      WHEN activity = 'quiz_complete' AND activity_score IS NOT NULL THEN 
        CASE 
          WHEN COALESCE(total_quiz_attempts, 0) = 0 THEN activity_score
          ELSE (COALESCE(average_quiz_score, 0) * COALESCE(total_quiz_attempts, 0) + activity_score) / (COALESCE(total_quiz_attempts, 0) + 1)
        END
      ELSE average_quiz_score
    END,
    best_quiz_score = CASE 
      WHEN activity = 'quiz_complete' AND activity_score IS NOT NULL THEN 
        GREATEST(COALESCE(best_quiz_score, 0), activity_score)
      ELSE best_quiz_score
    END
  WHERE username = user_name;
  
  RETURN activity_id;
END;
$$;

-- Update RLS policies for users table to allow proper updates
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'user_metadata' ->> 'username'::text)
    OR 
    username = (auth.jwt() ->> 'user_metadata' ->> 'username'::text)
    OR 
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'user_metadata' ->> 'username'::text) = 'Hari'
  )
  WITH CHECK (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'user_metadata' ->> 'username'::text)
    OR 
    username = (auth.jwt() ->> 'user_metadata' ->> 'username'::text)
    OR 
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'user_metadata' ->> 'username'::text) = 'Hari'
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION start_user_session(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION end_user_session(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity(TEXT, TEXT, JSONB, TEXT, INTEGER, INTEGER, TEXT) TO authenticated;