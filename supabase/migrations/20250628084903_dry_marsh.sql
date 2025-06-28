/*
  # Fix lesson ID type conversion from UUID to TEXT

  1. Schema Changes
    - Convert lessons.id from UUID to TEXT
    - Convert user_progress.lesson_id from UUID to TEXT
    - Maintain all constraints and indexes

  2. Security
    - Preserve all existing RLS policies
    - Maintain foreign key relationships
*/

-- First, drop the foreign key constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_lesson_id_fkey;

-- Drop the unique constraint (which will also drop its underlying index)
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_username_lesson_id_key;

-- Drop remaining indexes that depend on the UUID type
DROP INDEX IF EXISTS idx_user_progress_lesson_id;

-- Change lessons.id from UUID to TEXT
ALTER TABLE lessons ALTER COLUMN id TYPE TEXT;

-- Change user_progress.lesson_id from UUID to TEXT  
ALTER TABLE user_progress ALTER COLUMN lesson_id TYPE TEXT;

-- Recreate the foreign key constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

-- Recreate the index
CREATE INDEX idx_user_progress_lesson_id ON user_progress USING btree (lesson_id);

-- Recreate the unique constraint
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_username_lesson_id_key 
UNIQUE (username, lesson_id);