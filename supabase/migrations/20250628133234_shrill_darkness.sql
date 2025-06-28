/*
  # Fix user progress constraints and add ON CONFLICT handling

  1. Changes
    - Modify user_progress table to handle upserts properly
    - Add ON CONFLICT handling for user_progress updates
    - Fix progress calculation in user profile updates
  
  2. Security
    - Maintain existing RLS policies
*/

-- First, ensure the user_progress table has the correct constraints
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_username_lesson_id_key;

-- Recreate the unique constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_username_lesson_id_key 
UNIQUE (username, lesson_id);

-- Create a function to update user progress
CREATE OR REPLACE FUNCTION update_user_progress(
  p_username TEXT,
  p_lesson_id TEXT,
  p_completed BOOLEAN,
  p_score INT
) RETURNS VOID AS $$
BEGIN
  -- Insert or update user progress
  INSERT INTO user_progress (
    username,
    lesson_id,
    completed,
    score,
    completed_at
  ) VALUES (
    p_username,
    p_lesson_id,
    p_completed,
    p_score,
    now()
  )
  ON CONFLICT (username, lesson_id) 
  DO UPDATE SET
    completed = p_completed,
    score = p_score,
    completed_at = now();
    
  -- Update user profile progress
  IF p_completed THEN
    UPDATE users
    SET 
      progress = (
        SELECT 
          LEAST(100, ROUND(
            (COUNT(*) FILTER (WHERE completed = true)::NUMERIC / 
             GREATEST(COUNT(DISTINCT lesson_id), 1)::NUMERIC) * 100
          ))
        FROM user_progress
        WHERE username = p_username
      ),
      current_level = (
        SELECT 
          GREATEST(1, FLOOR(COUNT(*) FILTER (WHERE completed = true) / 3) + 1)
        FROM user_progress
        WHERE username = p_username
      ),
      last_lesson_completed = p_lesson_id,
      last_active = now()
    WHERE username = p_username;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_progress TO authenticated;