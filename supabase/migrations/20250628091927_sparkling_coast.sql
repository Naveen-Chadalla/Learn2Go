/*
  # Fix lesson ID type conversion from UUID to TEXT

  1. Changes
    - Convert lessons.id from UUID to TEXT
    - Convert user_progress.lesson_id from UUID to TEXT
    - Properly handle constraints and indexes during conversion

  2. Security
    - Maintain existing RLS policies
    - Preserve foreign key relationships
*/

-- First, drop the foreign key constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;

-- Drop the unique constraint (which will also drop the underlying index)
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_username_lesson_id_key;

-- Drop other indexes that depend on the lesson_id column
DROP INDEX IF EXISTS idx_user_progress_lesson_id;

-- Change lessons.id from UUID to TEXT
ALTER TABLE lessons ALTER COLUMN id TYPE TEXT;

-- Change user_progress.lesson_id from UUID to TEXT  
ALTER TABLE user_progress ALTER COLUMN lesson_id TYPE TEXT;

-- Recreate the foreign key constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

-- Recreate the unique constraint (this will automatically create the index)
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_username_lesson_id_key 
UNIQUE (username, lesson_id);

-- Recreate the index for lesson_id
CREATE INDEX idx_user_progress_lesson_id ON user_progress USING btree (lesson_id);