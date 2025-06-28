/*
  # Session Isolation and Activity Logging Enhancement

  1. Security
    - Enhanced RLS policies for user_activity_logs with proper JWT handling
    - Session isolation to prevent cross-user data access
    - Automatic cleanup of old sessions and activity logs

  2. Session Management
    - Prevent multiple active sessions per user
    - Automatic session cleanup and isolation
    - Enhanced activity tracking with session context

  3. Performance
    - Optimized indexes for session queries
    - Efficient cleanup functions for old data
    - Proper session state management
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "Admin can manage all activity logs" ON user_activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON user_activity_logs;

-- Create improved RLS policies for user_activity_logs with proper session isolation
CREATE POLICY "Users can view own activity logs"
  ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    username = COALESCE(
      (((current_setting('request.jwt.claims'::text, true))::json -> 'user_metadata'::text) ->> 'username'::text),
      ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text),
      split_part(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), '@'::text, 1)
    )
    OR (((current_setting('request.jwt.claims'::text, true))::json -> 'user_metadata'::text) ->> 'username'::text) = 'Hari'::text
  );

CREATE POLICY "Users can insert own activity logs"
  ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    username = COALESCE(
      (((current_setting('request.jwt.claims'::text, true))::json -> 'user_metadata'::text) ->> 'username'::text),
      ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text),
      split_part(((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text), '@'::text, 1)
    )
    OR (((current_setting('request.jwt.claims'::text, true))::json -> 'user_metadata'::text) ->> 'username'::text) = 'Hari'::text
  );

CREATE POLICY "Admin can manage all activity logs"
  ON user_activity_logs
  FOR ALL
  TO authenticated
  USING ((((current_setting('request.jwt.claims'::text, true))::json -> 'user_metadata'::text) ->> 'username'::text) = 'Hari'::text)
  WITH CHECK ((((current_setting('request.jwt.claims'::text, true))::json -> 'user_metadata'::text) ->> 'username'::text) = 'Hari'::text);

-- Add session isolation constraints to user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_username_active ON user_sessions(username, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_active ON user_sessions(session_token, is_active) WHERE is_active = true;

-- Function to ensure session isolation
CREATE OR REPLACE FUNCTION ensure_session_isolation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent multiple active sessions for the same user
  IF NEW.is_active = true THEN
    UPDATE user_sessions 
    SET is_active = false, 
        logout_time = now(),
        session_duration_seconds = EXTRACT(EPOCH FROM (now() - login_time))::integer
    WHERE username = NEW.username 
      AND is_active = true 
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for session isolation
DROP TRIGGER IF EXISTS trigger_ensure_session_isolation ON user_sessions;
CREATE TRIGGER trigger_ensure_session_isolation
  BEFORE INSERT OR UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION ensure_session_isolation();

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  -- Mark sessions as inactive if they haven't been active for more than 24 hours
  UPDATE user_sessions 
  SET is_active = false,
      logout_time = COALESCE(logout_time, last_activity),
      session_duration_seconds = COALESCE(
        session_duration_seconds,
        EXTRACT(EPOCH FROM (COALESCE(logout_time, last_activity) - login_time))::integer
      )
  WHERE is_active = true 
    AND last_activity < now() - INTERVAL '24 hours';
    
  -- Delete very old session records (older than 30 days)
  DELETE FROM user_sessions 
  WHERE login_time < now() - INTERVAL '30 days';
  
  -- Delete old activity logs (older than 90 days) except for admin user
  DELETE FROM user_activity_logs 
  WHERE timestamp < now() - INTERVAL '90 days'
    AND username != 'Hari';
END;
$$ LANGUAGE plpgsql;

-- Function to get user session info with isolation
CREATE OR REPLACE FUNCTION get_user_session_info(user_name text)
RETURNS TABLE (
  session_id uuid,
  session_token text,
  login_time timestamptz,
  last_activity timestamptz,
  is_active boolean,
  session_duration_seconds integer,
  pages_visited integer,
  lessons_completed integer,
  quizzes_taken integer,
  games_played integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.session_token,
    us.login_time,
    us.last_activity,
    us.is_active,
    us.session_duration_seconds,
    us.pages_visited,
    us.lessons_completed,
    us.quizzes_taken,
    us.games_played
  FROM user_sessions us
  WHERE us.username = user_name
    AND us.is_active = true
  ORDER BY us.login_time DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to log user activity with session isolation
CREATE OR REPLACE FUNCTION log_user_activity_isolated(
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
  current_session_id text;
BEGIN
  -- Get current session token if not provided
  IF session_token IS NULL THEN
    SELECT us.session_token INTO current_session_id
    FROM user_sessions us
    WHERE us.username = user_name 
      AND us.is_active = true
    ORDER BY us.login_time DESC
    LIMIT 1;
  ELSE
    current_session_id := session_token;
  END IF;

  -- Insert activity log with session isolation
  INSERT INTO user_activity_logs (
    username,
    activity_type,
    activity_details,
    session_id,
    duration_seconds,
    score,
    page_url,
    timestamp,
    ip_address,
    user_agent
  ) VALUES (
    user_name,
    activity,
    details,
    current_session_id,
    duration_secs,
    activity_score,
    page_path,
    now(),
    COALESCE((details ->> 'ip_address'), ''),
    COALESCE((details ->> 'user_agent'), '')
  ) RETURNING id INTO activity_id;
  
  -- Update session activity
  UPDATE user_sessions 
  SET last_activity = now(),
      pages_visited = CASE WHEN activity = 'page_view' THEN pages_visited + 1 ELSE pages_visited END,
      lessons_completed = CASE WHEN activity = 'lesson_complete' THEN lessons_completed + 1 ELSE lessons_completed END,
      quizzes_taken = CASE WHEN activity = 'quiz_attempt' THEN quizzes_taken + 1 ELSE quizzes_taken END,
      games_played = CASE WHEN activity = 'game_play' THEN games_played + 1 ELSE games_played END
  WHERE username = user_name 
    AND session_token = current_session_id
    AND is_active = true;
  
  -- Update user last activity
  UPDATE users 
  SET last_active = now(),
      current_page = COALESCE(page_path, current_page)
  WHERE username = user_name;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION ensure_session_isolation() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_session_info(text) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity_isolated(text, text, jsonb, text, integer, integer, text) TO authenticated;

-- Create a scheduled job to clean up old sessions (if pg_cron is available)
-- This will run daily at 2 AM
-- SELECT cron.schedule('cleanup-old-sessions', '0 2 * * *', 'SELECT cleanup_old_sessions();');