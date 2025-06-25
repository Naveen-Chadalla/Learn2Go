/*
  # User Activity Tracking System

  1. New Tables
    - `user_activity_logs` - Comprehensive activity tracking with flexible JSON storage
    - `user_sessions` - Detailed session management with duration tracking
  
  2. Enhanced Tables
    - `users` - Added activity tracking columns (streaks, totals, averages)
    - `user_progress` - Added detailed tracking columns (attempts, time, hints)
  
  3. Functions
    - `calculate_user_streak()` - Automatic streak calculations
    - `update_user_statistics()` - Real-time metric updates
    - `log_user_activity()` - Flexible activity logging
    - `start_user_session()` / `end_user_session()` - Session management
  
  4. Security
    - Enable RLS on all new tables
    - Add policies for user data access and admin privileges
    - Create indexes for performance optimization
*/

-- Create user activity logs table for comprehensive tracking
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  activity_type text NOT NULL, -- 'login', 'logout', 'lesson_start', 'lesson_complete', 'quiz_attempt', 'game_play', 'page_view'
  activity_details jsonb DEFAULT '{}', -- Flexible storage for activity-specific data
  timestamp timestamptz DEFAULT now(),
  session_id text,
  ip_address text,
  user_agent text,
  page_url text,
  duration_seconds integer, -- For activities with duration
  score integer, -- For quizzes and games
  metadata jsonb DEFAULT '{}' -- Additional flexible data storage
);

-- Create user sessions table for detailed session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  session_token text UNIQUE NOT NULL,
  login_time timestamptz DEFAULT now(),
  logout_time timestamptz,
  last_activity timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  is_active boolean DEFAULT true,
  session_duration_seconds integer,
  pages_visited integer DEFAULT 0,
  lessons_completed integer DEFAULT 0,
  quizzes_taken integer DEFAULT 0,
  games_played integer DEFAULT 0
);

-- Add activity tracking columns to existing users table
DO $$
BEGIN
  -- Add new activity tracking columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_login_count') THEN
    ALTER TABLE users ADD COLUMN total_login_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_session_time_seconds') THEN
    ALTER TABLE users ADD COLUMN total_session_time_seconds integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_streak_days') THEN
    ALTER TABLE users ADD COLUMN current_streak_days integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'longest_streak_days') THEN
    ALTER TABLE users ADD COLUMN longest_streak_days integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_lesson_completed') THEN
    ALTER TABLE users ADD COLUMN last_lesson_completed text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_page') THEN
    ALTER TABLE users ADD COLUMN current_page text DEFAULT 'offline';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_quiz_attempts') THEN
    ALTER TABLE users ADD COLUMN total_quiz_attempts integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_games_played') THEN
    ALTER TABLE users ADD COLUMN total_games_played integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'average_quiz_score') THEN
    ALTER TABLE users ADD COLUMN average_quiz_score numeric(5,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'best_quiz_score') THEN
    ALTER TABLE users ADD COLUMN best_quiz_score integer DEFAULT 0;
  END IF;
END $$;

-- Enhance user_progress table with detailed tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'attempt_count') THEN
    ALTER TABLE user_progress ADD COLUMN attempt_count integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'time_spent_seconds') THEN
    ALTER TABLE user_progress ADD COLUMN time_spent_seconds integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'started_at') THEN
    ALTER TABLE user_progress ADD COLUMN started_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'hints_used') THEN
    ALTER TABLE user_progress ADD COLUMN hints_used integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'difficulty_level') THEN
    ALTER TABLE user_progress ADD COLUMN difficulty_level integer DEFAULT 1;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_username ON user_activity_logs(username);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_timestamp ON user_activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_session_id ON user_activity_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_username ON user_sessions(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_login_time ON user_sessions(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Enable Row Level Security
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_logs
CREATE POLICY "Users can view own activity logs"
  ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text)
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  );

CREATE POLICY "System can insert activity logs"
  ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can manage all activity logs"
  ON user_activity_logs
  FOR ALL
  TO authenticated
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari');

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text)
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  );

CREATE POLICY "System can manage sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (
    username = ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text)
    OR ((current_setting('request.jwt.claims'::text, true))::json ->> 'username'::text) = 'Hari'
  );

-- Function to calculate user streaks
CREATE OR REPLACE FUNCTION calculate_user_streak(user_name text)
RETURNS integer AS $$
DECLARE
  current_streak integer := 0;
  check_date date;
  activity_found boolean;
BEGIN
  check_date := CURRENT_DATE;
  
  -- Check each day going backwards
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM user_activity_logs 
      WHERE username = user_name 
      AND activity_type IN ('lesson_complete', 'quiz_attempt', 'game_play')
      AND DATE(timestamp) = check_date
    ) INTO activity_found;
    
    IF activity_found THEN
      current_streak := current_streak + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      -- If today has no activity, check if yesterday does (grace period)
      IF check_date = CURRENT_DATE THEN
        check_date := check_date - INTERVAL '1 day';
      ELSE
        EXIT;
      END IF;
    END IF;
    
    -- Prevent infinite loops
    IF current_streak > 365 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_statistics(user_name text)
RETURNS void AS $$
DECLARE
  quiz_avg numeric;
  quiz_best integer;
  total_quizzes integer;
  total_games integer;
  current_streak integer;
  total_sessions integer;
  total_time integer;
BEGIN
  -- Calculate quiz statistics
  SELECT 
    COALESCE(AVG(score), 0),
    COALESCE(MAX(score), 0),
    COUNT(*)
  INTO quiz_avg, quiz_best, total_quizzes
  FROM user_progress 
  WHERE username = user_name AND completed = true;
  
  -- Calculate game statistics
  SELECT COUNT(*)
  INTO total_games
  FROM user_activity_logs
  WHERE username = user_name AND activity_type = 'game_play';
  
  -- Calculate streak
  SELECT calculate_user_streak(user_name) INTO current_streak;
  
  -- Calculate session statistics
  SELECT 
    COUNT(*),
    COALESCE(SUM(session_duration_seconds), 0)
  INTO total_sessions, total_time
  FROM user_sessions
  WHERE username = user_name AND logout_time IS NOT NULL;
  
  -- Update user record
  UPDATE users SET
    total_quiz_attempts = total_quizzes,
    total_games_played = total_games,
    average_quiz_score = quiz_avg,
    best_quiz_score = quiz_best,
    current_streak_days = current_streak,
    longest_streak_days = GREATEST(longest_streak_days, current_streak),
    total_login_count = total_sessions,
    total_session_time_seconds = total_time
  WHERE username = user_name;
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_name text,
  activity text,
  details jsonb DEFAULT '{}',
  session_token text DEFAULT NULL,
  duration_secs integer DEFAULT NULL,
  activity_score integer DEFAULT NULL,
  page_path text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  activity_id uuid;
BEGIN
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    activity_details,
    session_id,
    duration_seconds,
    score,
    page_url,
    timestamp
  ) VALUES (
    user_name,
    activity,
    details,
    session_token,
    duration_secs,
    activity_score,
    page_path,
    now()
  ) RETURNING id INTO activity_id;
  
  -- Update user statistics
  PERFORM update_user_statistics(user_name);
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start user session
CREATE OR REPLACE FUNCTION start_user_session(
  user_name text,
  session_token text,
  user_ip text DEFAULT NULL,
  user_agent_string text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
BEGIN
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
    ip_address,
    user_agent,
    is_active
  ) VALUES (
    user_name,
    session_token,
    now(),
    user_ip,
    user_agent_string,
    true
  ) RETURNING id INTO session_id;
  
  -- Log login activity
  PERFORM log_user_activity(user_name, 'login', jsonb_build_object('session_id', session_id), session_token);
  
  -- Update user login count
  UPDATE users SET 
    total_login_count = total_login_count + 1,
    session_start = now(),
    session_end = NULL
  WHERE username = user_name;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to end user session
CREATE OR REPLACE FUNCTION end_user_session(
  user_name text,
  session_token text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  session_duration integer;
BEGIN
  -- Update session record
  UPDATE user_sessions 
  SET 
    is_active = false,
    logout_time = now(),
    session_duration_seconds = EXTRACT(EPOCH FROM (now() - login_time))::integer
  WHERE username = user_name 
    AND (session_token IS NULL OR user_sessions.session_token = session_token)
    AND is_active = true
  RETURNING session_duration_seconds INTO session_duration;
  
  -- Log logout activity
  PERFORM log_user_activity(
    user_name, 
    'logout', 
    jsonb_build_object('session_duration', session_duration), 
    session_token,
    session_duration
  );
  
  -- Update user session end time
  UPDATE users SET 
    session_end = now(),
    total_session_time_seconds = total_session_time_seconds + COALESCE(session_duration, 0)
  WHERE username = user_name;
END;
$$ LANGUAGE plpgsql;